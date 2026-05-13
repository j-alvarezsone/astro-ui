import {
  createQueryCacheStore,
  createQueryStaleTimeContext,
  getOrCreateEntry,
  isEntryStale,
  resolveStaleTimeOption,
} from '@utils/query/cacheStore';
import { hashQueryKey } from '@utils/query/key';
import { executeQuery } from '@utils/query/queryCore';
import type {
  ClientQueryClient,
  ClientQueryClientOptions,
  ClientQueryController,
  ClientQueryState,
  QueryCacheStore,
  QueryCoreOptions,
  QueryOptions,
  QueryStateStatus,
} from '@utils/query/types';

/**
 * Create a client-side query client that manages cache entries and query controllers.
 *
 * @param options - Optional client configuration such as cache store, interceptors, and clock.
 * @returns A client query API with query creation and cache invalidation helpers.
 * @example
 * ```ts
 * const client = createClientQuery();
 * const userQuery = client.createQuery({
 *   queryKey: ['user', 1],
 *   queryFn: async () => ({ id: 1, name: 'Ada' }),
 * });
 * ```
 */
export function createClientQuery(options: ClientQueryClientOptions = {}): ClientQueryClient {
  const store = options.store ?? createQueryCacheStore();
  const coreOptions: QueryCoreOptions = {
    defaultRetry: options.defaultRetry,
    interceptors: options.interceptors,
    now: options.now,
  };

  return {
    createQuery<TData, TError = unknown>(queryOptions: QueryOptions<TData, TError>): ClientQueryController<TData, TError> {
      const keyHash = hashQueryKey(queryOptions.queryKey);
      const listeners = new Set<(state: ClientQueryState<TData, TError>) => void>();
      let state: ClientQueryState<TData, TError> = createInitialClientState(store, keyHash, queryOptions, options.now);

      const notify = (): void => {
        for (const listener of listeners) {
          listener(state);
        }
      };

      const settleState = (next: {
        status: QueryStateStatus;
        data?: TData;
        error: TError | null;
        isFetching: boolean;
        isStale: boolean;
      }): void => {
        state = {
          status: next.status,
          data: next.data,
          error: next.error ?? null,
          isStale: next.isStale,
          isPending: next.status === 'pending',
          isFetching: next.isFetching,
          isSuccess: next.status === 'success',
          isError: next.status === 'error',
        };
      };

      const execute = async (executeOptions: { force?: boolean } = {}): Promise<ClientQueryState<TData, TError>> => {
        const now = (options.now ?? Date.now)();
        const entry = getOrCreateEntry<TData, TError>(store, keyHash, now);
        const stale = isEntryStale(
          entry,
          resolveStaleTimeOption(
            queryOptions.staleTime,
            createQueryStaleTimeContext(queryOptions.queryKey, keyHash, entry),
          ),
          now,
        );

        if (!executeOptions.force && entry.hasData && !stale) {
          settleState({
            status: 'success',
            data: entry.data,
            error: null,
            isFetching: false,
            isStale: false,
          });
          notify();

          return state;
        }

        settleState({
          status: entry.hasData ? 'success' : 'pending',
          data: entry.data,
          error: null,
          isFetching: true,
          isStale: stale,
        });
        notify();

        const result = await executeQuery(
          store,
          {
            ...queryOptions,
            force: executeOptions.force,
            keyHash,
            client: true,
          },
          coreOptions,
        );

        if (result.status === 'success') {
          settleState({
            status: 'success',
            data: result.data,
            error: null,
            isFetching: false,
            isStale: false,
          });
        } else {
          settleState({
            status: 'error',
            data: entry.data,
            error: result.error ?? null,
            isFetching: false,
            isStale: stale,
          });
        }

        notify();

        return state;
      };

      const controller: ClientQueryController<TData, TError> = {
        getState: () => state,
        subscribe(listener: (nextState: ClientQueryState<TData, TError>) => void): () => void {
          listeners.add(listener);

          return () => listeners.delete(listener);
        },
        execute,
        refetch: async () => await execute({ force: true }),
        cancel(): void {
          const entry = store.get<TData, TError>(keyHash);
          entry?.abortController?.abort();
        },
        get status() {
          return state.status;
        },
        get data() {
          return state.data;
        },
        get error() {
          return state.error;
        },
        get isStale() {
          return state.isStale;
        },
        get isPending() {
          return state.isPending;
        },
        get isFetching() {
          return state.isFetching;
        },
        get isSuccess() {
          return state.isSuccess;
        },
        get isError() {
          return state.isError;
        },
      } as ClientQueryController<TData, TError>;

      if (queryOptions.autoExecute ?? true) {
        void execute();
      }

      return controller;
    },
    invalidate(queryKey: QueryOptions<unknown>['queryKey']): boolean {
      const keyHash = hashQueryKey(queryKey);

      return store.delete(keyHash);
    },
    clear(): void {
      store.clear();
    },
  };
}

/**
 * Create the initial client query state from the current cache entry.
 *
 * @param store - Cache store used to read or create the entry.
 * @param keyHash - Hashed query key.
 * @param queryOptions - Query options containing stale-time configuration.
 * @param nowFactory - Optional current-time provider.
 * @returns The initial client query state for a new controller.
 * @example
 * ```ts
 * const initialState = createInitialClientState(store, keyHash, queryOptions, Date.now);
 * ```
 */
function createInitialClientState<TData, TError = unknown>(
  store: QueryCacheStore,
  keyHash: string,
  queryOptions: QueryOptions<TData, TError>,
  nowFactory: (() => number) | undefined,
): ClientQueryState<TData, TError> {
  const now = (nowFactory ?? Date.now)();
  const entry = getOrCreateEntry<TData, TError>(store, keyHash, now);
  const stale = isEntryStale(
    entry,
    resolveStaleTimeOption(
      queryOptions.staleTime,
      createQueryStaleTimeContext(queryOptions.queryKey, keyHash, entry),
    ),
    now,
  );

  if (entry.hasData && !stale) {
    return {
      status: 'success',
      data: entry.data,
      error: null,
      isStale: false,
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
    };
  }

  return {
    status: 'idle',
    data: entry.data,
    error: entry.error ?? null,
    isStale: stale,
    isPending: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
  };
}
