import type { QueryRetryDelay, QueryRetryPredicate } from '@utils/query/types';

export const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 250;

/**
 * Safely read a property from an unknown object value.
 *
 * @param value - Candidate object value.
 * @param key - Property key to read.
 * @returns The property value when available, otherwise `undefined`.
 * @example
 * ```ts
 * const status = getObjectProperty(error, 'status');
 * ```
 */
function getObjectProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return Reflect.get(value, key);
}

/**
 * Read a numeric `status` field from an unknown value.
 *
 * @param value - Candidate value that may contain a numeric status.
 * @returns The numeric status code when present.
 * @example
 * ```ts
 * const status = getNumericStatus({ status: 500 });
 * ```
 */
function getNumericStatus(value: unknown): number | undefined {
  const status = getObjectProperty(value, 'status');

  return typeof status === 'number' ? status : undefined;
}

/**
 * Resolve the effective retry count from a retry option or default.
 *
 * @param retry - Custom retry option or predicate.
 * @param defaultRetry - Default retry count when no retry option is provided.
 * @returns The resolved retry count.
 * @example
 * ```ts
 * const retryCount = resolveRetryCount(undefined, 2); // 2
 * ```
 */
export function resolveRetryCount(
  retry: number | QueryRetryPredicate | undefined,
  defaultRetry?: number,
): number {
  if (typeof retry === 'number') {
    return Math.max(0, retry);
  }

  if (defaultRetry !== undefined) {
    return Math.max(0, defaultRetry);
  }

  return DEFAULT_RETRY_COUNT;
}

/**
 * Determine whether a failed query attempt should be retried.
 *
 * @param retry - Custom retry behavior or count.
 * @param attempt - Current attempt number.
 * @param retryCount - The maximum number of retry attempts.
 * @param error - The error thrown by the query attempt.
 * @returns `true` when the query should retry, otherwise `false`.
 * @example
 * ```ts
 * const retry = shouldRetry(undefined, 1, 3, { status: 503 }); // true
 * ```
 */
export function shouldRetry(
  retry: number | QueryRetryPredicate | undefined,
  attempt: number,
  retryCount: number,
  error: unknown,
): boolean {
  if (isAbortError(error)) {
    return false;
  }

  if (typeof retry === 'function') {
    return retry(error, attempt);
  }

  const retriesUsed = attempt - 1;

  if (retriesUsed >= retryCount) {
    return false;
  }

  return isRetriableError(error);
}

/**
 * Resolve the delay before the next retry attempt.
 *
 * @param retryDelay - Custom retry delay value or function.
 * @param attempt - The current retry attempt number.
 * @param error - The error thrown by the query attempt.
 * @returns The resolved delay in milliseconds.
 * @example
 * ```ts
 * const delayMs = resolveRetryDelay(undefined, 2, new Error('fail')); // 500
 * ```
 */
export function resolveRetryDelay(
  retryDelay: number | QueryRetryDelay | undefined,
  attempt: number,
  error: unknown,
): number {
  if (typeof retryDelay === 'function') {
    return Math.max(0, retryDelay(attempt, error));
  }

  if (typeof retryDelay === 'number') {
    return Math.max(0, retryDelay);
  }

  return Math.max(0, DEFAULT_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1));
}

/**
 * Delay for the specified time, rejecting if the provided signal aborts.
 *
 * @param milliseconds - The amount of time to wait in milliseconds.
 * @param signal - Optional abort signal that cancels the delay.
 * @returns A promise that resolves after the delay or rejects if aborted.
 * @example
 * ```ts
 * await delayWithSignal(250);
 * ```
 */
export async function delayWithSignal(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);

    const onAbort = (): void => {
      clearTimeout(timer);
      cleanup();
      reject(createAbortError());
    };

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort);
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Detect whether a thrown error appears to be an HTTP response error.
 *
 * @param error - The value thrown by the query function.
 * @returns `true` when the error contains an HTTP status field.
 * @example
 * ```ts
 * const isHttpError = isResponseError({ response: { status: 500 } }); // true
 * ```
 */
export function isResponseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (getNumericStatus(error) !== undefined) {
    return true;
  }

  const response = getObjectProperty(error, 'response');

  return getNumericStatus(response) !== undefined;
}

/**
 * Detect whether an error is an AbortError.
 *
 * @param error - The error value to inspect.
 * @returns `true` when the error is an AbortError instance.
 * @example
 * ```ts
 * const aborted = isAbortError(new DOMException('aborted', 'AbortError')); // true
 * ```
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Create a normalized AbortError instance.
 *
 * @returns A DOMException with the AbortError name.
 * @example
 * ```ts
 * const error = createAbortError();
 * console.log(error.name); // AbortError
 * ```
 */
export function createAbortError(): Error {
  return new DOMException('The operation was aborted', 'AbortError');
}

/**
 * Determine whether an error should be considered retriable.
 *
 * @param error - Error value from a failed query attempt.
 * @returns `true` for retriable errors, otherwise `false`.
 * @example
 * ```ts
 * isRetriableError({ status: 503 }); // true
 * ```
 */
function isRetriableError(error: unknown): boolean {
  if (isAbortError(error)) {
    return false;
  }

  if (!error || typeof error !== 'object') {
    return true;
  }

  const status = getErrorStatus(error);

  if (status === undefined) {
    return true;
  }

  return status >= 500;
}

/**
 * Extract an HTTP-like status code from an error object.
 *
 * @param error - Error object to inspect.
 * @returns The status code when available.
 * @example
 * ```ts
 * getErrorStatus({ response: { status: 502 } });
 * ```
 */
function getErrorStatus(error: object): number | undefined {
  const ownStatus = getNumericStatus(error);

  if (ownStatus !== undefined) {
    return ownStatus;
  }

  const response = getObjectProperty(error, 'response');

  return getNumericStatus(response);
}
