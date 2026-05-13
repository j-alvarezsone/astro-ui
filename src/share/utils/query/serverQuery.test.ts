import { createServerQuery } from '@utils/query/serverQuery';

describe('server query adapter', () => {
  it('refetch forces a new request even when cache is fresh', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const server = createServerQuery();
    const query = server.createQuery({
      queryKey: ['server-refetch-force'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    await query.execute();
    await query.execute();

    expect(queryFn).toHaveBeenCalledTimes(1);

    const refetchResult = await query.refetch();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(refetchResult.data).toBe(2);
    expect(refetchResult.isSuccess).toBe(true);
  });

  it('exposes error state and value when query execution fails', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();
      throw new Error('server boom');
    });

    const server = createServerQuery();
    const query = server.createQuery({
      queryKey: ['server-error-state'],
      queryFn,
      autoExecute: false,
      retry: 0,
    });

    const result = await query.execute();

    expect(result.isError).toBe(true);
    expect(query.isError).toBe(true);
    expect(result.error).toBeInstanceOf(Error);

    if (!(result.error instanceof Error)) {
      throw new TypeError('Expected result.error to be an Error instance.');
    }

    expect(result.error.message).toBe('server boom');
  });

  it('clears cache entries and executes again after clear', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const server = createServerQuery();

    const queryA = server.createQuery({
      queryKey: ['server-clear-cache'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    await queryA.execute();
    await queryA.execute();

    expect(queryFn).toHaveBeenCalledTimes(1);

    server.clear();

    const queryB = server.createQuery({
      queryKey: ['server-clear-cache'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    const secondResult = await queryB.execute();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(secondResult.data).toBe(2);
  });
});
