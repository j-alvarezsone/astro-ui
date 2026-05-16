import type {
  QueryCacheEntry,
  QueryCacheStore,
  QueryKey,
  QueryStaleTimeContext,
  QueryStaleTimeOption,
  QueryStaleTimeValue,
} from '@utils/query/types';

/**
 * Check whether a value matches the structural shape of a query cache entry.
 *
 * @param value - Candidate value from cache storage.
 * @returns `true` when the value has required cache entry properties.
 * @example
 * ```ts
 * isQueryCacheEntry({ hasData: false, updatedAt: 0, status: 'idle' });
 * ```
 */
function isQueryCacheEntry<TData, TError = unknown>(value: unknown): value is QueryCacheEntry<TData, TError> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'hasData' in value && 'updatedAt' in value && 'status' in value;
}

/**
 * Clear a scheduled garbage-collection timer from a cache entry.
 *
 * @param entry - Cache entry that may hold a pending GC timer.
 */
function clearEntryGcTimer<TData, TError = unknown>(entry: QueryCacheEntry<TData, TError>): void {
  if (entry.gcTimeoutId === undefined) {
    return;
  }

  clearTimeout(entry.gcTimeoutId);
  entry.gcTimeoutId = undefined;
}

/**
 * Create an in-memory query cache store used by client and server query adapters.
 *
 * @returns A new query cache store instance.
 * @example
 * ```ts
 * const store = createQueryCacheStore();
 * ```
 */
export function createQueryCacheStore(): QueryCacheStore {
  const store = new Map<string, unknown>();

  return {
    get<TData, TError = unknown>(key: string): QueryCacheEntry<TData, TError> | undefined {
      const entry = store.get(key);

      return isQueryCacheEntry<TData, TError>(entry) ? entry : undefined;
    },
    set<TData, TError = unknown>(key: string, entry: QueryCacheEntry<TData, TError>): void {
      store.set(key, entry);
    },
    has(key: string): boolean {
      return store.has(key);
    },
    delete(key: string): boolean {
      const entry = store.get(key);

      if (isQueryCacheEntry(entry)) {
        clearEntryGcTimer(entry);
      }

      return store.delete(key);
    },
    clear(): void {
      for (const value of store.values()) {
        if (isQueryCacheEntry(value)) {
          clearEntryGcTimer(value);
        }
      }

      store.clear();
    },
  };
}

/**
 * Retrieve an existing cache entry or create a new idle entry for the key.
 *
 * @param store - The query cache store to read from.
 * @param keyHash - The hashed query key.
 * @param now - The current timestamp used for new entries.
 * @returns The existing or newly created query cache entry.
 * @example
 * ```ts
 * const entry = getOrCreateEntry<string>(store, 'users:1', Date.now());
 * ```
 */
export function getOrCreateEntry<TData, TError = unknown>(
  store: QueryCacheStore,
  keyHash: string,
  now: number,
): QueryCacheEntry<TData, TError> {
  const existing = store.get<TData, TError>(keyHash);

  if (existing) {
    return existing;
  }

  const created: QueryCacheEntry<TData, TError> = {
    hasData: false,
    updatedAt: now,
    status: 'idle',
  };

  store.set(keyHash, created);

  return created;
}

/**
 * Build a stale-time context object for dynamic stale-time resolver functions.
 *
 * @param queryKey - The query key associated with the cache entry.
 * @param keyHash - The hashed query key.
 * @param entry - The query cache entry to derive context from.
 * @returns A stale-time context object used by resolver functions.
 * @example
 * ```ts
 * const context = createQueryStaleTimeContext(['users', 1], 'users:1', entry);
 * ```
 */
export function createQueryStaleTimeContext<TData, TError = unknown>(
  queryKey: QueryKey,
  keyHash: string,
  entry: QueryCacheEntry<TData, TError>,
): QueryStaleTimeContext<TData, TError> {
  return {
    queryKey,
    keyHash,
    hasData: entry.hasData,
    data: entry.data,
    error: entry.error ?? null,
    updatedAt: entry.updatedAt,
    status: entry.status,
  };
}

/**
 * Resolve a stale-time option to a concrete numeric or sentinel stale-time value.
 *
 * @param staleTime - The stale-time option or resolver function.
 * @param context - The context passed to a stale-time resolver.
 * @returns The resolved stale-time value.
 * @example
 * ```ts
 * const staleTime = resolveStaleTimeOption(1_000, context); // 1000
 * ```
 */
export function resolveStaleTimeOption<TData, TError = unknown>(
  staleTime: QueryStaleTimeOption<TData, TError> | undefined,
  context: QueryStaleTimeContext<TData, TError>,
): QueryStaleTimeValue {
  if (typeof staleTime === 'function') {
    return staleTime(context);
  }

  if (staleTime === undefined) {
    return 0;
  }

  return staleTime;
}

/**
 * Determine whether a cache entry should be considered stale.
 *
 * @param entry - The cache entry to evaluate.
 * @param staleTime - The resolved stale-time value to compare against.
 * @param now - The current timestamp used to calculate freshness.
 * @returns `true` when the entry is stale, otherwise `false`.
 * @example
 * ```ts
 * const stale = isEntryStale(entry, 5_000, Date.now());
 * ```
 */
export function isEntryStale<TData, TError = unknown>(
  entry: QueryCacheEntry<TData, TError>,
  staleTime: QueryStaleTimeValue | undefined,
  now: number,
): boolean {
  if (!entry.hasData) {
    return true;
  }

  if (staleTime === 'static' || staleTime === Number.POSITIVE_INFINITY) {
    return false;
  }

  if (staleTime === undefined) {
    return true;
  }

  if (staleTime <= 0) {
    return true;
  }

  return now - entry.updatedAt >= staleTime;
}
