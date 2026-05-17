import { createQueryStaleTimeContext, getOrCreateEntry, isEntryStale, resolveStaleTimeOption } from '@utils/query/cacheStore';
import { mergeInterceptors, runOnRequestErrorInterceptors, runOnRequestInterceptors, runOnResponseErrorInterceptors, runOnResponseInterceptors } from '@utils/query/interceptors';
import { delayWithSignal, isAbortError, isResponseError, resolveRetryCount, resolveRetryDelay, shouldRetry } from '@utils/query/retry';
import type {
  QueryCacheEntry,
  QueryCacheStore,
  QueryCoreOptions,
  QueryExecutionOptions,
  QueryExecutionResult,
  QueryInterceptor,
  QueryLifecycleContext,
} from '@utils/query/types';

const DEFAULT_GC_TIME_MS = 5 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647; // Maximum delay for setTimeout in most browsers (approximately 24.8 days)

export interface RunQueryAttemptOptions<TData, TError = unknown> {
  attempt: number;
  entry: QueryCacheEntry<TData, TError>;
  options: QueryExecutionOptions<TData, TError>;
  mergedInterceptors: QueryInterceptor<TData, TError>[];
  context: QueryLifecycleContext<TData, TError>;
  controller: AbortController;
  now: () => number;
  retryCount: number;
}

/**
 * Convert a runtime `unknown` error into the generic query error type.
 *
 * TypeScript cannot prove a relationship between `unknown` and `TError` at runtime.
 * This helper centralizes the cast at one internal boundary to keep the public API clean.
 *
 * @param error - The unknown error thrown by query execution.
 * @returns The error value typed as `TError` for downstream handlers.
 * @example
 * ```ts
 * const typedError = toTypedError<MyDomainError>(error);
 * ```
 */
function toTypedError<TError>(error: unknown): TError {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return error as TError;
}

/**
 * Execute or re-use a query lifecycle, returning cached or fresh results.
 *
 * This helper manages deduplication, retries, request/response interceptors,
 * abort behavior, and cache storage for both client and server adapters.
 *
 * @param store - The cache store used to find or create query entries.
 * @param options - Query execution options including key, fn, and retry settings.
 * @param coreOptions - Global core options such as interceptors and now provider.
 * @returns A promise resolving to the query execution result.
 * @example
 * ```ts
 * const result = await executeQuery(store, {
 *   queryKey: ['user', userId],
 *   queryFn: async ({ signal }) => fetchUser(userId, { signal }),
 *   staleTime: 30_000,
 *   client: false,
 *   keyHash: hashQueryKey(['user', userId]),
 * }, { now: Date.now });
 * ```
 */
export async function executeQuery<TData, TError = unknown>(
  store: QueryCacheStore,
  options: QueryExecutionOptions<TData, TError>,
  coreOptions: QueryCoreOptions,
): Promise<QueryExecutionResult<TData, TError>> {
  const now = coreOptions.now ?? Date.now;
  const entry = getOrCreateEntry<TData, TError>(store, options.keyHash, now());
  const effectiveGcTime = mergeGcTime(entry.gcTime, resolveGcTime(options.gcTime, options.client));

  entry.gcTime = effectiveGcTime;
  clearEntryGcTimeout(entry);

  const currentIsStale = isEntryStale(
    entry,
    resolveStaleTimeOption(
      options.staleTime,
      createQueryStaleTimeContext<TData, TError>(options.queryKey, options.keyHash, entry),
    ),
    now(),
  );

  if (!options.force && entry.hasData && !currentIsStale) {
    scheduleEntryGc(store, options.keyHash, entry);

    return {
      keyHash: options.keyHash,
      isFromCache: true,
      status: 'success',
      data: entry.data,
    };
  }

  if (entry.promise) {
    if ((options.dedupe ?? 'join') === 'join') {
      return await entry.promise;
    }

    if ((options.dedupe ?? 'join') === 'cancel') {
      entry.abortController?.abort();
    }
  }

  const executionPromise = executeWithLifecycle<TData, TError>(entry, options, coreOptions, now);
  entry.promise = executionPromise;

  store.set(options.keyHash, entry);

  try {
    return await executionPromise;
  } finally {
    if (entry.promise === executionPromise) {
      entry.promise = undefined;
      entry.abortController = undefined;
      store.set(options.keyHash, entry);
      scheduleEntryGc(store, options.keyHash, entry);
    }
  }
}

/**
 * Resolve an effective garbage-collection time for a query entry.
 *
 * Defaults to 5 minutes for client queries and `Infinity` for server queries.
 *
 * @param gcTime - Optional query-specific garbage-collection time in milliseconds.
 * @param client - Whether the query runs in a client context.
 * @returns A non-negative GC time in milliseconds or `Infinity`.
 */
function resolveGcTime(gcTime: number | undefined, client: boolean): number {
  if (gcTime === Number.POSITIVE_INFINITY) {
    return Number.POSITIVE_INFINITY;
  }

  if (gcTime !== undefined) {
    return Math.max(0, gcTime);
  }

  return client ? DEFAULT_GC_TIME_MS : Number.POSITIVE_INFINITY;
}

/**
 * Merge two GC times so the longer retention period always wins.
 *
 * @param current - Existing GC time already associated with the cache entry.
 * @param next - New GC time requested by a query execution.
 * @returns The merged GC time value.
 */
function mergeGcTime(current: number | undefined, next: number): number {
  if (current === undefined) {
    return next;
  }

  if (current === Number.POSITIVE_INFINITY || next === Number.POSITIVE_INFINITY) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(current, next);
}

/**
 * Clear an entry GC timeout when the entry is reused.
 *
 * @param entry - Cache entry that may contain a pending GC timeout.
 */
function clearEntryGcTimeout<TData, TError = unknown>(entry: QueryCacheEntry<TData, TError>): void {
  if (entry.gcTimeoutId === undefined) {
    return;
  }

  clearTimeout(entry.gcTimeoutId);
  entry.gcTimeoutId = undefined;
}

/**
 * Schedule cache-entry garbage collection when the entry becomes inactive.
 *
 * @param store - Query cache store used to remove stale entries.
 * @param keyHash - Hashed key that identifies the entry in the store.
 * @param entry - Cache entry to schedule for eventual removal.
 */
function scheduleEntryGc<TData, TError = unknown>(
  store: QueryCacheStore,
  keyHash: string,
  entry: QueryCacheEntry<TData, TError>,
): void {
  clearEntryGcTimeout(entry);

  if (entry.gcTime === undefined || entry.gcTime === Number.POSITIVE_INFINITY) {
    return;
  }

  const timeoutMs = Math.min(entry.gcTime, MAX_TIMEOUT_MS);
  entry.gcTimeoutId = setTimeout(() => {
    const currentEntry = store.get<TData, TError>(keyHash);

    if (currentEntry !== entry || currentEntry?.promise) {
      return;
    }

    store.delete(keyHash);
  }, timeoutMs);
}

/**
 * Execute a query attempt lifecycle with interceptors, callbacks, and retries.
 *
 * @param entry - The cache entry bound to this query key.
 * @param options - Query execution options.
 * @param coreOptions - Global query core options.
 * @param now - Timestamp provider.
 * @returns A query execution result after success or terminal failure.
 * @example
 * ```ts
 * const result = await executeWithLifecycle(entry, options, coreOptions, Date.now);
 * ```
 */
async function executeWithLifecycle<TData, TError = unknown>(
  entry: QueryCacheEntry<TData, TError>,
  options: QueryExecutionOptions<TData, TError>,
  coreOptions: QueryCoreOptions,
  now: () => number,
): Promise<QueryExecutionResult<TData, TError>> {
  const mergedInterceptors = mergeInterceptors<TData, TError>(coreOptions.interceptors, options.interceptors);
  const retryCount = resolveRetryCount(options.retry, coreOptions.defaultRetry);
  const controller = createLinkedAbortController(options.signal);
  const context: QueryLifecycleContext<TData, TError> = {
    queryKey: options.queryKey,
    keyHash: options.keyHash,
    options,
    attempt: 1,
    client: options.client,
  };

  entry.abortController = controller;
  entry.status = 'pending';

  await runOnRequestInterceptors(mergedInterceptors, context);

  return await runQueryAttempt({
    attempt: 1,
    entry,
    options,
    mergedInterceptors,
    context,
    controller,
    now,
    retryCount,
  });
}

/**
 * Run one query attempt and recursively continue when retry rules allow it.
 *
 * @param runOptions - Attempt context, query options, and shared lifecycle dependencies.
 * @returns A query execution result after success or terminal failure.
 * @example
 * ```ts
 * const result = await runQueryAttempt({
 *   attempt: 1,
 *   entry,
 *   options,
 *   mergedInterceptors,
 *   context,
 *   controller,
 *   now: Date.now,
 *   retryCount: 2,
 * });
 * ```
 */
export async function runQueryAttempt<TData, TError = unknown>(
  runOptions: RunQueryAttemptOptions<TData, TError>,
): Promise<QueryExecutionResult<TData, TError>> {
  const {
    attempt,
    entry,
    options,
    mergedInterceptors,
    context,
    controller,
    now,
    retryCount,
  } = runOptions;

  context.attempt = attempt;

  try {
    const data = await options.queryFn({
      queryKey: options.queryKey,
      signal: controller.signal,
      attempt,
      client: options.client,
      meta: options.meta,
    });

    entry.hasData = true;
    entry.data = data;
    entry.error = undefined;
    entry.updatedAt = now();
    entry.status = 'success';

    await runOnResponseInterceptors(mergedInterceptors, context, data);
    await options.onSuccess?.(data);

    return {
      keyHash: options.keyHash,
      isFromCache: false,
      status: 'success',
      data,
    };
  } catch (error: unknown) {
    const typedError = toTypedError<TError>(error);

    if (isResponseError(error)) {
      await runOnResponseErrorInterceptors(mergedInterceptors, context, typedError);
    } else {
      await runOnRequestErrorInterceptors(mergedInterceptors, context, typedError);
    }

    if (!shouldRetry(options.retry, attempt, retryCount, error) || isAbortError(error)) {
      entry.error = typedError;
      entry.status = 'error';
      await options.onError?.(typedError);

      return {
        keyHash: options.keyHash,
        isFromCache: false,
        status: 'error',
        error: typedError,
      };
    }

    const retryDelay = resolveRetryDelay(options.retryDelay, attempt, error);
    await delayWithSignal(retryDelay, controller.signal);

    return await runQueryAttempt({
      ...runOptions,
      attempt: attempt + 1,
    });
  }
}

/**
 * Create an abort controller linked to an optional parent signal.
 *
 * @param signal - Optional parent signal to mirror abort events from.
 * @returns A new abort controller linked to the parent when provided.
 * @example
 * ```ts
 * const controller = createLinkedAbortController(request.signal);
 * ```
 */
function createLinkedAbortController(signal: AbortSignal | undefined): AbortController {
  const controller = new AbortController();

  if (!signal) {
    return controller;
  }

  if (signal.aborted) {
    controller.abort();
    return controller;
  }

  const abortFromParent = () => {
    controller.abort();
  };

  signal.addEventListener('abort', abortFromParent, {
    once: true,
    signal: controller.signal,
  });

  return controller;
}
