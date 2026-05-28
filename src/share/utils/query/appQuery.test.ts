import { invalidateQuery, invalidateServerQuery, useClientQuery, useMutationQuery, useServerQuery } from '@utils/query/appQuery';
import type { AstroRouteCacheInvalidatorLike, AstroRouteCacheLike, AstroRouteCacheSetOptions } from '@utils/query/types';

const NOOP_STRING_RESOLVER = (_value: string): void => {};

function makeAstroCache(overrides?: Partial<AstroRouteCacheLike>) {
  return {
    enabled: true,
    set: vi.fn<(options: AstroRouteCacheSetOptions | false) => void>(),
    ...overrides,
  } satisfies AstroRouteCacheLike;
}

describe('query app wrapper', () => {
  it('auto-executes server query and returns populated controller by default', async () => {
    const serverFn = vi.fn(async () => await Promise.resolve('server-ok'));

    const { data, execute, refetch } = await useServerQuery({
      queryFn: serverFn,
      routeCache: {
        cache: makeAstroCache(),
      },
    });

    expect(serverFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('server-ok');
    expect(typeof execute).toBe('function');
    expect(typeof refetch).toBe('function');
  });

  it('does not fetch when autoExecute is false and exposes execute on the controller', async () => {
    const serverFn = vi.fn(async () => await Promise.resolve('manual-ok'));

    const { execute } = await useServerQuery({
      queryFn: serverFn,
      routeCache: {
        cache: makeAstroCache(),
      },
      autoExecute: false,
    });

    expect(serverFn).toHaveBeenCalledTimes(0);

    const { data } = await execute();

    expect(serverFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('manual-ok');
  });

  it('returns client controllers from shared wrapper function', async () => {
    const clientFn = vi.fn(async () => await Promise.resolve('client-ok'));

    const client = useClientQuery({
      queryKey: ['app-client'],
      queryFn: clientFn,
      autoExecute: false,
    });

    const { data } = await client.execute();

    expect(clientFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('client-ok');
  });

  it('forwards typed payload to mutationFn on mutate', async () => {
    type Payload = { name: string; email: string };
    let capturedPayload: unknown;

    const mutation = useMutationQuery<string, Payload>({
      mutationKey: ['app-mutation-payload'],
      mutationFn: async (payload) => {
        capturedPayload = payload;
        return await Promise.resolve('payload-ok');
      },
    });

    await mutation.mutate({ name: 'Alice', email: 'alice@example.com' });

    expect(capturedPayload).toEqual({ name: 'Alice', email: 'alice@example.com' });
  });

  it('returns mutation controllers that only run on mutate', async () => {
    const mutationFn = vi.fn(async () => await Promise.resolve('mutation-ok'));

    const mutation = useMutationQuery({
      mutationKey: ['app-mutation'],
      mutationFn,
    });

    expect(mutationFn).toHaveBeenCalledTimes(0);
    expect(mutation.isIdle).toBe(true);

    const { data } = await mutation.mutate();

    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('mutation-ok');
    expect(mutation.isSuccess).toBe(true);
    expect(mutation.isIdle).toBe(false);
  });

  it('exposes the mutation-focused controller surface', async () => {
    const mutationFn = vi.fn(async () => await Promise.resolve('mutation-execute'));

    const mutation = useMutationQuery({
      mutationKey: ['app-mutation-execute-refetch'],
      mutationFn,
      staleTime: Number.POSITIVE_INFINITY,
    });

    expect(typeof mutation.mutate).toBe('function');
    expect(typeof mutation.reset).toBe('function');
    expect(typeof mutation.subscribe).toBe('function');
    expect(typeof mutation.isIdle).toBe('boolean');
    expect(typeof mutation.isPending).toBe('boolean');
    expect(typeof mutation.isSuccess).toBe('boolean');
    expect(typeof mutation.isError).toBe('boolean');

    const { data } = await mutation.mutate();

    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('mutation-execute');
  });

  it('resets mutation state to initial idle state', async () => {
    const mutationFn = vi.fn(async () => await Promise.resolve('mutation-reset'));

    const mutation = useMutationQuery({
      mutationKey: ['app-mutation-reset'],
      mutationFn,
    });

    await mutation.mutate();
    expect(mutation.isSuccess).toBe(true);
    expect(mutation.isIdle).toBe(false);

    mutation.reset();

    expect(mutation.status).toBe('idle');
    expect(mutation.data).toBeUndefined();
    expect(mutation.error).toBeNull();
    expect(mutation.isIdle).toBe(true);
    expect(mutation.isPending).toBe(false);
    expect(mutation.isSuccess).toBe(false);
    expect(mutation.isError).toBe(false);
  });

  it('does not keep mutation query active after unsubscribe', async () => {
    const mutationFn = vi.fn(async () => await Promise.resolve('mutation-idle'));

    const mutation = useMutationQuery({
      mutationKey: ['app-mutation-unsubscribe'],
      mutationFn,
    });

    await mutation.mutate();
    expect(mutationFn).toHaveBeenCalledTimes(1);

    const unsubscribe = mutation.subscribe(() => {});

    unsubscribe();

    invalidateQuery(['app-mutation-unsubscribe'], {
      refetchType: 'active',
    });

    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it('forwards route-cache tags and path invalidation options', async () => {
    const cache = {
      enabled: true,
      invalidate: vi.fn(async () => await Promise.resolve()),
    } satisfies AstroRouteCacheInvalidatorLike;

    await invalidateServerQuery({
      cache,
      tags: ['users'],
      path: '/query-system/server-query',
    });

    expect(cache.invalidate).toHaveBeenCalledWith({
      tags: ['users'],
      path: '/query-system/server-query',
    });
  });

  it('sets pending state again on a second mutate call', async () => {
    let secondResolve: (value: string) => void = NOOP_STRING_RESOLVER;
    const secondResult = new Promise<string>((resolve) => {
      secondResolve = resolve;
    });
    let callCount = 0;
    const mutationFn = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return await Promise.resolve('first-result');
      }

      return await secondResult;
    });

    const mutation = useMutationQuery({
      mutationKey: ['app-mutation-second-pending'],
      mutationFn,
    });

    await mutation.mutate();
    expect(mutation.isSuccess).toBe(true);

    const pendingRun = mutation.mutate();
    await Promise.resolve();

    expect(mutation.isPending).toBe(true);

    secondResolve('second-result');
    await pendingRun;

    expect(mutation.isSuccess).toBe(true);
    expect(mutation.data).toBe('second-result');
  });

  describe('useServerQuery with routeCache.cache', () => {
    it('calls cache.set when route cache options are provided', async () => {
      const cache = makeAstroCache();
      const serverFn = vi.fn(async () => await Promise.resolve('cached-ok'));

      const { data } = await useServerQuery({
        queryFn: serverFn,
        routeCache: {
          cache,
          maxAge: 30_000,
          swr: 60_000,
          tags: ['users'],
        },
      });

      expect(data).toBe('cached-ok');
      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        expect.objectContaining({ maxAge: 30, swr: 60 }),
      );
    });

    it('does not call cache.set when cache.enabled is false', async () => {
      const cache = makeAstroCache({ enabled: false });
      const serverFn = vi.fn(async () => await Promise.resolve('disabled-cache'));

      const { data } = await useServerQuery({
        queryFn: serverFn,
        routeCache: {
          cache,
          maxAge: 30_000,
        },
      });

      expect(data).toBe('disabled-cache');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('does not call cache.set when route maxAge is static and no swr or tags are provided', async () => {
      const cache = makeAstroCache();
      const serverFn = vi.fn(async () => await Promise.resolve('no-directives'));

      const { data } = await useServerQuery({
        queryFn: serverFn,
        routeCache: {
          cache,
          maxAge: 'static',
        },
      });

      expect(data).toBe('no-directives');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('still executes successfully with route cache options', async () => {
      const cache = makeAstroCache();
      const serverFn = vi.fn(async () => await Promise.resolve('no-cache'));

      const { data } = await useServerQuery({
        queryFn: serverFn,
        routeCache: {
          cache,
          maxAge: 10_000,
        },
      });

      expect(data).toBe('no-cache');
      expect(serverFn).toHaveBeenCalledTimes(1);
    });
  });
});
