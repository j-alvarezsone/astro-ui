import { applyAstroRouteCache } from '@utils/query/astroCache';
import {
  createQueryCacheStore,
  createQueryStaleTimeContext,
  getOrCreateEntry,
  isEntryStale,
  resolveStaleTimeOption,
} from '@utils/query/cacheStore';
import { hashQueryKey } from '@utils/query/key';
import { executeQuery, executeQueryUncached } from '@utils/query/queryCore';
import type {
  QueryKey,
  QueryCoreOptions,
  ServerQueryClient,
  ServerQueryClientOptions,
  ServerQueryController,
  ServerQueryDefaultModeOptions,
  ServerQueryOptions,
  ServerQueryQueryModeOptions,
  ServerQueryRouteController,
  ServerQueryRouteModeOptions,
  ServerQueryRouteResult,
  ServerQueryResult,
} from '@utils/query/types';

const ROUTE_EXECUTION_QUERY_KEY: QueryKey = ['__route-execution'];
const ROUTE_EXECUTION_KEY_HASH = '__route-execution-hash';

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

  function createQuery<TData, TError = unknown>(
    queryOptions: ServerQueryDefaultModeOptions<TData, TError>,
  ): ServerQueryController<TData, TError>;
  function createQuery<TData, TError = unknown>(
    queryOptions: ServerQueryQueryModeOptions<TData, TError>,
  ): ServerQueryController<TData, TError>;
  function createQuery<TData, TError = unknown>(
    queryOptions: ServerQueryRouteModeOptions<TData, TError>,
  ): ServerQueryRouteController<TData, TError>;
  function createQuery<TData, TError = unknown>(
    queryOptions: ServerQueryOptions<TData, TError>,
  ): ServerQueryController<TData, TError> | ServerQueryRouteController<TData, TError> {
    const isRouteMode = queryOptions.cacheMode === 'route';
    // Route mode identifiers are execution metadata only, not shared cache-store keys.
    const executionQueryKey: QueryKey = isRouteMode ? ROUTE_EXECUTION_QUERY_KEY : queryOptions.queryKey;
    const executionKeyHash = isRouteMode ? ROUTE_EXECUTION_KEY_HASH : hashQueryKey(queryOptions.queryKey);
    let lastResult: ServerQueryResult<TData, TError> | ServerQueryRouteResult<TData, TError> = {
      data: undefined,
      error: null,
      keyHash: executionKeyHash,
      isFromCache: false,
      isSuccess: false,
      isError: false,
      isStale: true,
    };

    const computeIsStale = (): boolean => {
      if (isRouteMode) {
        return false;
      }

      const now = (options.now ?? Date.now)();
      const entry = getOrCreateEntry<TData, TError>(store, executionKeyHash, now);

      return isEntryStale(
        entry,
        resolveStaleTimeOption(
          queryOptions.staleTime,
          createQueryStaleTimeContext(executionQueryKey, executionKeyHash, entry),
        ),
        now,
      );
    };

    const execute = async (
      executeOptions: { force?: boolean } = {},
    ): Promise<ServerQueryResult<TData, TError> | ServerQueryRouteResult<TData, TError>> => {
      const routeCache = isRouteMode ? queryOptions.routeCache : undefined;

      applyAstroRouteCache({
        cache: routeCache?.cache,
        queryKey: isRouteMode ? undefined : queryOptions.queryKey,
        maxAge: routeCache?.maxAge,
        swr: routeCache?.swr,
        tags: routeCache?.tags,
      });

      const result = isRouteMode
        ? await executeQueryUncached(
          {
            ...queryOptions,
            queryKey: executionQueryKey,
            force: executeOptions.force,
            keyHash: executionKeyHash,
            client: false,
          },
          coreOptions,
        )
        : await executeQuery(
          store,
          {
            ...queryOptions,
            queryKey: executionQueryKey,
            force: executeOptions.force,
            keyHash: executionKeyHash,
            client: false,
          },
          coreOptions,
        );

      if (isRouteMode) {
        lastResult = {
          data: result.data,
          error: result.error ?? null,
          keyHash: executionKeyHash,
          isSuccess: result.status === 'success',
          isError: result.status === 'error',
          isStale: computeIsStale(),
        };
      } else {
        lastResult = {
          data: result.data,
          error: result.error ?? null,
          keyHash: executionKeyHash,
          isFromCache: result.isFromCache,
          isSuccess: result.status === 'success',
          isError: result.status === 'error',
          isStale: computeIsStale(),
        };
      }

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
      get isFromCache() {
        return 'isFromCache' in lastResult ? lastResult.isFromCache : false;
      },
      get isSuccess() {
        return lastResult.isSuccess;
      },
      get isError() {
        return lastResult.isError;
      },
      execute,
      refetch: async () => await execute({ force: true }),
    } as ServerQueryController<TData, TError> | ServerQueryRouteController<TData, TError>;

    if (queryOptions.autoExecute ?? true) {
      void execute();
    }

    return controller;
  }

  return {
    createQuery,
    invalidate(queryKey: QueryKey): boolean {
      return store.delete(hashQueryKey(queryKey));
    },
    clear(): void {
      store.clear();
    },
  };
}
