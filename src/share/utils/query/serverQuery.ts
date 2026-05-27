import { applyAstroRouteCache } from '@utils/query/astroCache';
import { executeQueryUncached } from '@utils/query/queryCore';
import type {
  QueryCoreOptions,
  ServerQueryClient,
  ServerQueryClientOptions,
  ServerQueryController,
  ServerQueryOptions,
  ServerQueryResult,
} from '@utils/query/types';

const ROUTE_EXECUTION_QUERY_KEY = ['__route-execution'] as const;
const ROUTE_EXECUTION_KEY_HASH = '__route-execution-hash';

/**
 * Create a server-side query client with cache support and optional Astro cache bridging.
 *
 * @param options - Server query client configuration options.
 * @returns A server query client with query creation, fetch, invalidate, and clear APIs.
 */
export function createServerQuery(options: ServerQueryClientOptions = {}): ServerQueryClient {
  const coreOptions: QueryCoreOptions = {
    defaultRetry: options.defaultRetry,
    interceptors: options.interceptors,
    now: options.now,
  };

  function createQuery<TData, TError = unknown>(
    queryOptions: ServerQueryOptions<TData, TError>,
  ): ServerQueryController<TData, TError> {
    let lastResult: ServerQueryResult<TData, TError> = {
      data: undefined,
      error: null,
      keyHash: ROUTE_EXECUTION_KEY_HASH,
      isSuccess: false,
      isError: false,
      isStale: false,
    };

    const execute = async (
      executeOptions: { force?: boolean } = {},
    ): Promise<ServerQueryResult<TData, TError>> => {
      applyAstroRouteCache({
        cache: queryOptions.routeCache.cache,
        maxAge: queryOptions.routeCache.maxAge,
        swr: queryOptions.routeCache.swr,
        tags: queryOptions.routeCache.tags,
      });

      const result = await executeQueryUncached(
        {
          ...queryOptions,
          queryKey: ROUTE_EXECUTION_QUERY_KEY,
          force: executeOptions.force,
          keyHash: ROUTE_EXECUTION_KEY_HASH,
          client: false,
        },
        coreOptions,
      );

      lastResult = {
        data: result.data,
        error: result.error ?? null,
        keyHash: ROUTE_EXECUTION_KEY_HASH,
        isSuccess: result.status === 'success',
        isError: result.status === 'error',
        isStale: false,
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
  }

  return {
    createQuery,
    invalidate(): boolean {
      return false;
    },
    clear(): void {},
  };
}
