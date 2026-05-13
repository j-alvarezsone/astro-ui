import { applyAstroRouteCache } from '@utils/query/astroCache';
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
  QueryCoreOptions,
  ServerQueryClient,
  ServerQueryClientOptions,
  ServerQueryController,
  ServerQueryOptions,
  ServerQueryResult,
} from '@utils/query/types';

/**
 * Create a server-side query client with cache support and optional Astro cache bridging.
 *
 * @param options - Server query client configuration options.
 * @returns A server query client with query creation, fetch, invalidate, and clear APIs.
 */
export function createServerQuery(options: ServerQueryClientOptions = {}): ServerQueryClient {
  const store = options.store ?? createQueryCacheStore();
  const coreOptions: QueryCoreOptions = {
    defaultRetry: options.defaultRetry,
    interceptors: options.interceptors,
    now: options.now,
  };

  const createQuery = <TData, TError = unknown>(queryOptions: ServerQueryOptions<TData, TError>): ServerQueryController<TData, TError> => {
    const keyHash = hashQueryKey(queryOptions.queryKey);
    let lastResult: ServerQueryResult<TData, TError> = {
      data: undefined,
      error: null,
      keyHash,
      fromCache: false,
      isSuccess: false,
      isError: false,
      isStale: true,
    };

    const computeIsStale = (): boolean => {
      const now = (options.now ?? Date.now)();
      const entry = getOrCreateEntry<TData, TError>(store, keyHash, now);

      return isEntryStale(
        entry,
        resolveStaleTimeOption(
          queryOptions.staleTime,
          createQueryStaleTimeContext(queryOptions.queryKey, keyHash, entry),
        ),
        now,
      );
    };

    const execute = async (executeOptions: { force?: boolean } = {}): Promise<ServerQueryResult<TData, TError>> => {
      const staleTime = resolveStaleTimeOption(
        queryOptions.staleTime,
        createQueryStaleTimeContext(
          queryOptions.queryKey,
          keyHash,
          getOrCreateEntry<TData, TError>(store, keyHash, (options.now ?? Date.now)()),
        ),
      );

      applyAstroRouteCache({
        cache: options.astroCache,
        queryKey: queryOptions.queryKey,
        staleTime,
        swr: queryOptions.swr,
        tags: queryOptions.tags,
      });

      const result = await executeQuery(
        store,
        {
          ...queryOptions,
          force: executeOptions.force,
          keyHash,
          client: false,
        },
        coreOptions,
      );

      lastResult = {
        data: result.data,
        error: result.error ?? null,
        keyHash,
        fromCache: result.fromCache,
        isSuccess: result.status === 'success',
        isError: result.status === 'error',
        isStale: computeIsStale(),
      };

      return lastResult;
    };

    const controller = {
      get status() {
        return lastResult.isSuccess ? 'success' : lastResult.isError ? 'error' : 'idle';
      },
      get data() {
        return lastResult.data;
      },
      get error() {
        return lastResult.error;
      },
      get isStale() {
        return lastResult.isStale;
      },
      get keyHash() {
        return lastResult.keyHash;
      },
      get fromCache() {
        return lastResult.fromCache;
      },
      get isSuccess() {
        return lastResult.isSuccess;
      },
      get isError() {
        return lastResult.isError;
      },
      execute,
      refetch: async () => await execute({ force: true }),
    } as ServerQueryController<TData, TError>;

    if (queryOptions.autoExecute ?? true) {
      void execute();
    }

    return controller;
  };

  return {
    createQuery,
    invalidate(queryKey: ServerQueryOptions<unknown>['queryKey']): boolean {
      return store.delete(hashQueryKey(queryKey));
    },
    clear(): void {
      store.clear();
    },
  };
}
