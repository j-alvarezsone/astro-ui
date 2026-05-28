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
  QueryInvalidateRefetchType,
  QueryOptions,
  QueryStateStatus,
} from '@utils/query/types';

function isArrayKey(queryKey: QueryOptions<unknown>['queryKey']): queryKey is readonly unknown[] {
  return Array.isArray(queryKey);
}

/**
 * Compare two query-key segments using deterministic key hashing.
 *
 * @param left - Segment from the partial key.
 * @param right - Segment from the full key.
 * @returns `true` when both segments serialize to the same stable representation.
 * @example
 * ```ts
 * areQueryKeySegmentsEqual({ id: 1 }, { id: 1 }); // true
 * ```
 */
function areQueryKeySegmentsEqual(left: unknown, right: unknown): boolean {
  return hashQueryKey([left]) === hashQueryKey([right]);
}

function matchesPartialKey(
  partial: QueryOptions<unknown>['queryKey'],
  full: QueryOptions<unknown>['queryKey'],
): boolean {
  if (!isArrayKey(partial) || !isArrayKey(full)) {
    return hashQueryKey(partial) === hashQueryKey(full);
  }

  if (partial.length > full.length) {
    return false;
  }

  for (let index = 0; index < partial.length; index += 1) {
    if (!areQueryKeySegmentsEqual(partial[index], full[index])) {
      return false;
    }
  }

  return true;
}

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
  const queryRecords = new Set<{
    keyHash: string;
    queryKey: QueryOptions<unknown>['queryKey'];
    execute: (options?: { force?: boolean }) => Promise<unknown>;
    isActive: () => boolean;
  }>();
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
          notify();
        } else {
          settleState({
            status: 'error',
            data: entry.data,
            error: result.error ?? null,
            isFetching: false,
            isStale: stale,
          });
          notify();
        }

        return state;
      };

      const queryRecord = {
        keyHash,
        queryKey: queryOptions.queryKey,
        execute: async (executeOptions?: { force?: boolean }) => await execute(executeOptions),
        isActive: () => listeners.size > 0,
      };
      queryRecords.add(queryRecord);

      const controller: ClientQueryController<TData, TError> = {
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
      };

      if (queryOptions.autoExecute ?? true) {
        void execute();
      }

      return controller;
    },
    invalidate(
      queryKey: QueryOptions<unknown>['queryKey'],
      invalidateOptions: { exact?: boolean; refetchType?: QueryInvalidateRefetchType } = {},
    ): boolean {
      const keyHash = hashQueryKey(queryKey);
      const exact = invalidateOptions.exact ?? true;
      const refetchType = invalidateOptions.refetchType ?? 'active';
      let invalidated = false;

      for (const queryRecord of queryRecords) {
        const matches = exact
          ? queryRecord.keyHash === keyHash
          : matchesPartialKey(queryKey, queryRecord.queryKey);

        if (!matches) {
          continue;
        }

        invalidated = store.delete(queryRecord.keyHash) || invalidated;
        if (refetchType === 'active' && queryRecord.isActive()) {
          void queryRecord.execute({ force: true });
        }
      }

      return invalidated;
    },
    clear(): void {
      store.clear();
      queryRecords.clear();
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
