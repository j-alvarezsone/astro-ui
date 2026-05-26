import { createClientQuery } from '@utils/query/clientQuery';
import { createServerQuery } from '@utils/query/serverQuery';

describe('query adapters: client and server behavior', () => {
  it('client query exposes isStale and resets to stale after invalidate', async () => {
    const client = createClientQuery({
      now: () => Date.now(),
    });

    const query = client.createQuery({
      queryKey: ['client-stale-flag'],
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      staleTime: 5_000,
    });

    expect(query.isStale).toBe(true);

    await query.execute();

    expect(query.isStale).toBe(false);

    expect(client.invalidate(['client-stale-flag'])).toBe(true);

    const queryAfterInvalidate = client.createQuery({
      queryKey: ['client-stale-flag'],
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      staleTime: 5_000,
    });

    expect(queryAfterInvalidate.isStale).toBe(true);
  });

  it('client query supports staleTime resolver and static freshness semantics', async () => {
    const resolver = vi.fn(() => 'static' as const);
    const client = createClientQuery();
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const query = client.createQuery({
      queryKey: ['client-stale-resolver'],
      queryFn,
      autoExecute: false,
      staleTime: resolver,
    });

    await query.execute();
    await query.execute();

    expect(resolver).toHaveBeenCalled();
    expect(query.isStale).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('server query exposes isStale and resets to stale after invalidate', async () => {
    const server = createServerQuery({
      now: () => Date.now(),
    });

    const query = server.createQuery({
      queryKey: ['server-stale-flag'],
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      staleTime: 5_000,
    });

    expect(query.isStale).toBe(true);

    await query.execute();

    expect(query.isStale).toBe(false);

    expect(server.invalidate(['server-stale-flag'])).toBe(true);

    const queryAfterInvalidate = server.createQuery({
      queryKey: ['server-stale-flag'],
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      staleTime: 5_000,
    });

    expect(queryAfterInvalidate.isStale).toBe(true);
  });

  it('server query treats Infinity staleTime as fresh unless invalidated', async () => {
    const server = createServerQuery();
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const query = server.createQuery({
      queryKey: ['server-infinity-stale'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    await query.execute();
    await query.execute();

    expect(query.isStale).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(1);

    expect(server.invalidate(['server-infinity-stale'])).toBe(true);
    const queryAfterInvalidate = server.createQuery({
      queryKey: ['server-infinity-stale'],
      queryFn,
      autoExecute: false,
      staleTime: Number.POSITIVE_INFINITY,
    });

    expect(queryAfterInvalidate.isStale).toBe(true);
  });

  it('client query exposes pending/fetching state transitions', async () => {
    const client = createClientQuery();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const query = client.createQuery({
      queryKey: ['client-state'],
      autoExecute: false,
      queryFn: async () => {
        await gate;

        return { ok: true };
      },
    });

    const pendingPromise = query.execute();
    await Promise.resolve();

    expect(query.isFetching).toBe(true);
    expect(query.isPending).toBe(true);

    release();
    const settled = await pendingPromise;

    expect(settled.isSuccess).toBe(true);
    expect(settled.isFetching).toBe(false);
    expect(settled.isPending).toBe(false);
  });

  it('client query auto-executes by default', async () => {
    const client = createClientQuery();
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const query = client.createQuery({
      queryKey: ['client-auto-execute'],
      queryFn,
    });

    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(query.isSuccess).toBe(true);
    expect(query.isFetching).toBe(false);
  });

  it('server query supports manual execute when autoExecute is false', async () => {
    const server = createServerQuery();
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const query = server.createQuery({
      queryKey: ['server-manual-execute'],
      queryFn,
      autoExecute: false,
    });

    expect(queryFn).not.toHaveBeenCalled();

    const result = await query.execute();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result.isSuccess).toBe(true);
  });

  it('server query auto-executes by default', async () => {
    const server = createServerQuery();
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return { ok: true };
    });

    const query = server.createQuery({
      queryKey: ['server-auto-execute'],
      queryFn,
    });

    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    expect(query.isSuccess).toBe(true);
  });

  it('server query result omits client loading flags and can apply Astro cache', async () => {
    const set = vi.fn();
    const server = createServerQuery();

    const query = server.createQuery({
      queryFn: async () => {
        await Promise.resolve();

        return { ok: true };
      },
      autoExecute: false,
      cacheMode: 'route',
      routeCache: {
        cache: {
          enabled: true,
          set,
        },
        maxAge: 1500,
        tags: ['server'],
      },
    });

    const result = await query.execute();

    expect(result.isSuccess).toBe(true);
    expect('isPending' in result).toBe(false);
    expect(set).toHaveBeenCalledTimes(1);
  });
});
