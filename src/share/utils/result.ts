/**
 * Discriminated union for explicit success or failure handling.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Wraps a successful value in a `Result`.
 *
 * @param value - Successful value.
 * @returns Successful result wrapper.
 *
 * @example
 * const result = Ok('ready');
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Wraps an error in a `Result`.
 *
 * @param error - Failure value.
 * @returns Failed result wrapper.
 *
 * @example
 * const result = Err(new Error('failed'));
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Checks whether a `Result` represents success.
 *
 * @param result - Result to inspect.
 * @returns True when the result is successful.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Checks whether a `Result` represents failure.
 *
 * @param result - Result to inspect.
 * @returns True when the result is failed.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}