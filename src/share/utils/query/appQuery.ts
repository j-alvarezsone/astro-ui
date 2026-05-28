import { createClientQuery } from './clientQuery';
import { createServerQuery } from './serverQuery';
import type {
  InvalidateServerQueryOptions,
  MutationController,
  MutationOptions,
  MutationState,
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

type MutationSnapshot<TData, TError = unknown> = {
  status: MutationState<TData, TError>['status'];
  data?: TData;
  error: TError | null;
  isFetching?: boolean;
};

type InvalidateServerQueryArgs = InvalidateServerQueryOptions & {
  queryKey?: QueryKey;
};

/**
 * Convert internal query state into the mutation-focused public state.
 *
 * For mutations, any in-flight request is surfaced as `pending` so UI loading
 * behavior is consistent across first and subsequent mutation executions.
 *
 * @param state - Internal mutation snapshot from the query controller.
 * @returns Public mutation state with status-derived boolean flags.
 * @example
 * const mapped = toMutationState({ status: 'success', isFetching: true, error: null });
 * // mapped.status === 'pending'
 */
function toMutationState<TData, TError = unknown>(state: MutationSnapshot<TData, TError>): MutationState<TData, TError> {
  const resolvedStatus = state.isFetching ? 'pending' : state.status;

  return {
    status: resolvedStatus,
    data: state.data,
    error: state.error,
    isIdle: resolvedStatus === 'idle',
    isPending: resolvedStatus === 'pending',
    isSuccess: resolvedStatus === 'success',
    isError: resolvedStatus === 'error',
  };
}

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
 * @returns A mutation controller with `mutate`, `reset`, `subscribe`, and status-derived flags.
 *
 * @example
 * const addUser = useMutationQuery({
 *   mutationKey: ['users', 'add'],
 *   mutationFn: async (payload) => {
 *   if (!payload) {
 *    throw new Error('User payload is required');
 *  }
 *
 *     return postNewUser(payload);
 *   },
 * });
 * await addUser.mutate({ name: 'Alice', email: 'alice@example.com' });
 */
export const useMutationQuery = <TData, TPayload = unknown, TError = unknown>(
  mutationOptions: MutationOptions<TData, TPayload, TError>,
): MutationController<TData, TPayload, TError> => {
  let currentPayload: TPayload | undefined;
  const { mutationFn, mutationKey, ...restMutationOptions } = mutationOptions;

  const controller = clientQuery.createQuery({
    ...restMutationOptions,
    queryKey: mutationKey,
    queryFn: async (context) => await mutationFn(currentPayload, context),
    autoExecute: false,
  });

  const listeners = new Set<(state: MutationState<TData, TError>) => void>();
  let bridgeUnsubscribe: (() => void) | null = null;

  let mutationState = toMutationState({
    status: controller.status,
    data: controller.data,
    error: controller.error,
  });

  const notify = (): void => {
    for (const listener of listeners) {
      listener(mutationState);
    }
  };

  const ensureBridgeSubscription = (): void => {
    if (bridgeUnsubscribe) {
      return;
    }

    bridgeUnsubscribe = controller.subscribe((state) => {
      mutationState = toMutationState({
        status: state.status,
        data: state.data,
        error: state.error,
        isFetching: state.isFetching,
      });
      notify();
    });
  };

  const maybeDisposeBridgeSubscription = (): void => {
    if (listeners.size > 0 || !bridgeUnsubscribe) {
      return;
    }

    bridgeUnsubscribe();
    bridgeUnsubscribe = null;
  };

  return {
    subscribe: (listener) => {
      ensureBridgeSubscription();
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        maybeDisposeBridgeSubscription();
      };
    },
    mutate: async (payload?: TPayload): Promise<MutationState<TData, TError>> => {
      const hadBridgeSubscription = Boolean(bridgeUnsubscribe);
      if (!hadBridgeSubscription) {
        ensureBridgeSubscription();
      }

      currentPayload = payload;
      const state = await controller.execute({ force: true });
      mutationState = toMutationState({
        status: state.status,
        data: state.data,
        error: state.error,
      });
      notify();
      if (!hadBridgeSubscription) {
        maybeDisposeBridgeSubscription();
      }

      return mutationState;
    },
    reset: () => {
      mutationState = {
        status: 'idle',
        data: undefined,
        error: null,
        isIdle: true,
        isPending: false,
        isSuccess: false,
        isError: false,
      };
      notify();
    },
    get status() {
      return mutationState.status;
    },
    get data() {
      return mutationState.data;
    },
    get error() {
      return mutationState.error;
    },
    get isIdle() {
      return mutationState.isIdle;
    },
    get isPending() {
      return mutationState.isPending;
    },
    get isSuccess() {
      return mutationState.isSuccess;
    },
    get isError() {
      return mutationState.isError;
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
 * const { data, execute, refetch } = await useServerQuery({
 *   queryFn,
 *   routeCache: { cache: Astro.cache },
 * });
 * ```
 *
 * Set `autoExecute: false` to defer fetching and call `execute()` yourself.
 * `data` is always read from the controller, never from `execute()`:
 *
 * ```ts
 * const query = await useServerQuery({
 *   queryFn,
 *   routeCache: { cache: Astro.cache },
 *   autoExecute: false,
 * });
 * await query.execute();
 * const { data } = query;
 * ```
 *
 * @param queryOptions - Server query options.
 * @returns A promise that resolves to the server query controller.
 */
export async function useServerQuery<TData, TError = unknown>(
  queryOptions: ServerQueryOptions<TData, TError>,
): Promise<ServerQueryController<TData, TError>>;
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
 * @param args - Server query invalidation arguments.
 * @param args.queryKey - Optional key used to clear the server query store entry.
 * @param args.cache - Optional Astro route-cache invalidator.
 * @param args.tags - Optional route-cache tags for invalidation.
 * @param args.path - Optional route path for invalidation.
 * @returns `true` when a server query store entry was invalidated; `false` when no key was provided or no matching entry exists.
 * @example
 * invalidateServerQuery({ queryKey: ['users'] });
 *
 * @example
 * await invalidateServerQuery({
 *   queryKey: ['users'],
 *   cache,
 *   tags: ['users'],
 * });
 *
 * @example
 * await invalidateServerQuery({
 *   cache,
 *   tags: ['users'],
 * });
 */
export async function invalidateServerQuery(
  args: InvalidateServerQueryArgs = {},
): Promise<boolean> {
  const { queryKey, ...options } = args;

  const invalidated = queryKey ? serverQuery.invalidate(queryKey) : false;

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
