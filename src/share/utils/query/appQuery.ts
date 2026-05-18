import { createClientQuery } from './clientQuery';
import { createServerQuery } from './serverQuery';
import type {
  InvalidateServerQueryOptions,
  MutationController,
  MutationOptions,
  QueryKey,
  ServerQueryController,
  ServerQueryOptions,
} from './types';


const clientQuery = createClientQuery({
  defaultRetry: 3,
});

const serverQuery = createServerQuery({
  defaultRetry: 3,
});

type ClientCreateQuery = typeof clientQuery.createQuery;
type ClientInvalidate = typeof clientQuery.invalidate;

/**
 * Create a client query controller using the shared client query instance.
 *
 * @param args - Arguments forwarded to the shared client query creator.
 * @returns A client query controller instance.
 */
export const useClientQuery: ClientCreateQuery = (...args) => clientQuery.createQuery(...args);

/**
 * Create a client mutation controller using the shared client query instance.
 *
 * Mutations never auto-execute and expose `mutate()` as an explicit trigger.
 * Internally, `mutate()` forces execution to always perform a network request.
 *
 * @param mutationOptions - Mutation options including key, function, and callbacks.
 * @returns A mutation controller with `mutate`, `execute`, and state flags.
 *
 * @example
 * const addUser = useMutationQuery({
 *   queryKey: ['users', 'add'],
 *   queryFn: async (context) => {
 *     const userData = context.payload as CreateUserBody;
 *     return postNewUser(userData);
 *   },
 * });
 * await addUser.mutate({ name: 'Alice', email: 'alice@example.com' });
 */
export const useMutationQuery = <TData, TPayload = unknown, TError = unknown>(
  mutationOptions: MutationOptions<TData, TPayload, TError>,
): MutationController<TData, TPayload, TError> => {
  const controller = clientQuery.createQuery({
    ...mutationOptions,
    autoExecute: false,
  });

  return {
    subscribe: controller.subscribe,
    execute: controller.execute,
    refetch: controller.refetch,
    cancel: controller.cancel,
    mutate: async (payload?: TPayload) => await controller.execute({ force: true, payload }),
    get status() {
      return controller.status;
    },
    get data() {
      return controller.data;
    },
    get error() {
      return controller.error;
    },
    get isStale() {
      return controller.isStale;
    },
    get isPending() {
      return controller.isPending;
    },
    get isFetching() {
      return controller.isFetching;
    },
    get isSuccess() {
      return controller.isSuccess;
    },
    get isError() {
      return controller.isError;
    },
  };
};

/**
 * Create a server query controller and optionally execute it for SSR use.
 *
 * With the default `autoExecute: true`, the query fetches before the
 * controller is returned so `data` is populated at destructuring time:
 *
 * ```ts
 * const { data, execute, refetch } = await useServerQuery({ queryKey, queryFn });
 * ```
 *
 * Set `autoExecute: false` to defer fetching and call `execute()` yourself.
 * `data` is always read from the controller, never from `execute()`:
 *
 * ```ts
 * const query = await useServerQuery({ queryKey, queryFn, autoExecute: false });
 * await query.execute();
 * const { data } = query;
 * ```
 *
 * @param queryOptions - Server query options.
 * @returns A promise that resolves to the server query controller.
 */
export async function useServerQuery<TData, TError = unknown>(
  queryOptions: ServerQueryOptions<TData, TError>,
): Promise<ServerQueryController<TData, TError>> {
  const query = serverQuery.createQuery({
    ...queryOptions,
    autoExecute: false,
  });

  if (queryOptions.autoExecute !== false) {
    await query.execute();
  }

  return query;
}

/**
 * Remove a cached client query entry by query key.
 *
 * @param args - The query key arguments used to remove a cache entry.
 * @returns `true` when the cache entry existed and was removed.
 * @example
 * invalidateQuery(['users']);
 * invalidateQuery(['users'], { exact: true, refetchType: 'active' });
 */
export const invalidateQuery: ClientInvalidate = (...args) => clientQuery.invalidate(...args);

/**
 * Remove a cached server query entry by query key.
 *
 * This clears the shared SSR query store so the next server render executes
 * the query function again instead of reusing stale in-memory data.
 *
 * When an Astro route cache invalidator is provided, this helper can also
 * invalidate route-cache tags/path in the same call.
 *
 * @param queryKey - Query key used to clear the server query store entry.
 * @param options - Optional Astro route-cache invalidation options.
 * @returns `true` when the server query store entry existed and was removed.
 * @example
 * invalidateServerQuery(['users']);
 *
 * @example
 * await invalidateServerQuery(['users'], {
 *   cache,
 *   tags: ['users'],
 * });
 */
export async function invalidateServerQuery(
  queryKey: QueryKey,
  options: InvalidateServerQueryOptions = {},
): Promise<boolean> {
  const invalidated = serverQuery.invalidate(queryKey);

  const hasTags = Boolean(options.tags?.length);
  const hasPath = typeof options.path === 'string' && options.path.length > 0;

  if (options.cache?.enabled && (hasTags || hasPath)) {
    await options.cache.invalidate({
      ...(hasPath ? { path: options.path } : {}),
      ...(hasTags ? { tags: options.tags } : {}),
    });
  }

  return invalidated;
}

/**
 * Clear the shared client query cache entirely.
 *
 * @returns void.
 */
export const clearClientQueryCache = (): void => clientQuery.clear();
