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

  it('runs onSuccess once per successful execution', async () => {
    const onSuccess = vi.fn();
    const client = createClientQuery();
    const query = client.createQuery({
      queryKey: ['client-on-success-once'],
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      onSuccess,
    });

    await query.execute();

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('invalidates and refetches only active matching queries by default', async () => {
    const usersQueryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });
    const petsQueryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const client = createClientQuery();
    const usersQuery = client.createQuery({
      queryKey: ['users', 'list'],
      queryFn: usersQueryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });
    const petsQuery = client.createQuery({
      queryKey: ['pets', 'list'],
      queryFn: petsQueryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    const unsubscribe = usersQuery.subscribe(() => {});

    await usersQuery.execute();
    await petsQuery.execute();

    expect(usersQueryFn).toHaveBeenCalledTimes(1);
    expect(petsQueryFn).toHaveBeenCalledTimes(1);

    const invalidated = client.invalidate(['users']);

    expect(invalidated).toBe(false);

    const invalidatedPartial = client.invalidate(['users'], { exact: false });

    expect(invalidatedPartial).toBe(true);

    await vi.waitFor(() => {
      expect(usersQueryFn).toHaveBeenCalledTimes(2);
    });

    expect(petsQueryFn).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('does not refetch active queries when invalidate refetchType is none', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const client = createClientQuery();
    const query = client.createQuery({
      queryKey: ['products'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    const unsubscribe = query.subscribe(() => {});

    await query.execute();
    expect(queryFn).toHaveBeenCalledTimes(1);

    const invalidated = client.invalidate(['products'], { refetchType: 'none' });

    expect(invalidated).toBe(true);
    expect(queryFn).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('passes typed payload from execute options to the query function context', async () => {
    type Payload = { name: string };
    let capturedPayload: unknown;

    const client = createClientQuery();
    const query = client.createQuery<string, unknown, Payload>({
      queryKey: ['client-payload-execute'],
      queryFn: async (context) => {
        capturedPayload = context.payload;
        return await Promise.resolve('ok');
      },
      autoExecute: false,
    });

    await query.execute({ payload: { name: 'Alice' } });

    expect(capturedPayload).toEqual({ name: 'Alice' });
  });

  it('does not pass payload when execute is called without it', async () => {
    type Payload = { name: string };
    let capturedPayload: unknown = 'NOT_CALLED';

    const client = createClientQuery();
    const query = client.createQuery<string, unknown, Payload>({
      queryKey: ['client-payload-undefined'],
      queryFn: async (context) => {
        capturedPayload = context.payload;
        return await Promise.resolve('ok');
      },
      autoExecute: false,
    });

    await query.execute();

    expect(capturedPayload).toEqual(undefined);
  });

  it('still passes queryOptions.meta to context.meta independently', async () => {
    let capturedMeta: Record<string, unknown> | undefined;
    type Payload = { id: number };

    const client = createClientQuery();
    const query = client.createQuery<string, unknown, Payload>({
      queryKey: ['client-meta-preserved'],
      queryFn: async (context) => {
        capturedMeta = context.meta;
        return await Promise.resolve('ok');
      },
      autoExecute: false,
      meta: { source: 'query', tracing: 'enabled' },
    });

    await query.execute({ payload: { id: 42 } });

    expect(capturedMeta).toEqual({ source: 'query', tracing: 'enabled' });
  });
});
