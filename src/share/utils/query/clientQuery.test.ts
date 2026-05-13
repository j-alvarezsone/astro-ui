import { createClientQuery } from '@utils/query/clientQuery';

describe('client query adapter', () => {
  it('refetch forces a new request even when cache is fresh', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const client = createClientQuery();
    const query = client.createQuery({
      queryKey: ['client-refetch-force'],
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
  });

  it('notifies subscribers and stops notifications after unsubscribe', async () => {
    const client = createClientQuery();
    const query = client.createQuery({
      queryKey: ['client-subscribe'],
      queryFn: async () => {
        await Promise.resolve();

        return 'ok';
      },
      autoExecute: false,
    });

    const listener = vi.fn();
    const unsubscribe = query.subscribe(listener);

    await query.execute();

    expect(listener).toHaveBeenCalled();

    const callsAfterFirstExecute = listener.mock.calls.length;
    unsubscribe();

    await query.refetch();

    expect(listener).toHaveBeenCalledTimes(callsAfterFirstExecute);
  });

  it('clears cache entries and executes again after clear', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const client = createClientQuery();

    const queryA = client.createQuery({
      queryKey: ['client-clear-cache'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    await queryA.execute();
    await queryA.execute();

    expect(queryFn).toHaveBeenCalledTimes(1);

    client.clear();

    const queryB = client.createQuery({
      queryKey: ['client-clear-cache'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    const secondResult = await queryB.execute();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(secondResult.data).toBe(2);
  });
});
