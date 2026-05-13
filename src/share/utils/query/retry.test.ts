import {
  createAbortError,
  delayWithSignal,
  isAbortError,
  isResponseError,
  resolveRetryCount,
  resolveRetryDelay,
  shouldRetry,
} from '@utils/query/retry';

describe('query retry helpers', () => {
  it('returns the default retry count when none is provided', () => {
    expect(resolveRetryCount(undefined)).toBe(3);
    expect(resolveRetryCount(undefined, 0)).toBe(0);
    expect(resolveRetryCount(5)).toBe(5);
  });

  it('resolves retry delay from a function and numeric value', () => {
    expect(resolveRetryDelay(300, 1, new Error('fail'))).toBe(300);
    expect(resolveRetryDelay((attempt) => attempt * 100, 2, new Error('fail'))).toBe(200);
    expect(resolveRetryDelay(undefined, 2, new Error('fail'))).toBeGreaterThanOrEqual(250);
  });

  it('does not retry AbortError values', () => {
    const abortError = createAbortError();

    expect(shouldRetry(undefined, 1, 3, abortError)).toBe(false);
    expect(isAbortError(abortError)).toBe(true);
  });

  it('retries server errors and stops after the retry count is exhausted', () => {
    expect(shouldRetry(undefined, 1, 3, { status: 500 })).toBe(true);
    expect(shouldRetry(undefined, 4, 3, { status: 500 })).toBe(false);
    expect(shouldRetry(undefined, 1, 3, { status: 400 })).toBe(false);
    expect(isResponseError({ status: 404 })).toBe(true);
    expect(isResponseError({ response: { status: 502 } })).toBe(true);
    expect(isResponseError('not-an-error')).toBe(false);
  });

  it('resolves immediately for zero milliseconds', async () => {
    await expect(delayWithSignal(0)).resolves.toBeUndefined();
  });

  it('rejects when the provided signal aborts before the delay completes', async () => {
    const controller = new AbortController();
    const promise = delayWithSignal(1_000, controller.signal);

    controller.abort();

    await expect(promise).rejects.toThrow(/Abort/i);
  });
});
