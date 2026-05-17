import { useClientQuery, useServerQuery } from '@utils/query/appQuery';
import type { AstroRouteCacheLike, AstroRouteCacheSetOptions } from '@utils/query/types';

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
      queryKey: ['app-server'],
      queryFn: serverFn,
    });

    expect(serverFn).toHaveBeenCalledTimes(1);
    expect(data).toBe('server-ok');
    expect(typeof execute).toBe('function');
    expect(typeof refetch).toBe('function');
  });

  it('does not fetch when autoExecute is false and exposes execute on the controller', async () => {
    const serverFn = vi.fn(async () => await Promise.resolve('manual-ok'));

    const { execute } = await useServerQuery({
      queryKey: ['app-server-manual'],
      queryFn: serverFn,
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

  describe('useServerQuery with meta.astroCache', () => {
    it('calls cache.set when a valid astroCache and staleTime are provided', async () => {
      const cache = makeAstroCache();
      const serverFn = vi.fn(async () => await Promise.resolve('cached-ok'));

      const { data } = await useServerQuery({
        queryKey: ['app-server-cache'],
        queryFn: serverFn,
        staleTime: 30_000,
        swr: 60_000,
        tags: ['users'],
        meta: { astroCache: cache },
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
        queryKey: ['app-server-cache-disabled'],
        queryFn: serverFn,
        staleTime: 30_000,
        meta: { astroCache: cache },
      });

      expect(data).toBe('disabled-cache');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('does not call cache.set when staleTime is static and no swr or tags are provided', async () => {
      const cache = makeAstroCache();
      const serverFn = vi.fn(async () => await Promise.resolve('no-directives'));

      const { data } = await useServerQuery({
        queryKey: ['app-server-cache-no-directives'],
        queryFn: serverFn,
        staleTime: 'static',
        meta: { astroCache: cache },
      });

      expect(data).toBe('no-directives');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('still executes successfully when meta.astroCache is absent', async () => {
      const serverFn = vi.fn(async () => await Promise.resolve('no-cache'));

      const { data } = await useServerQuery({
        queryKey: ['app-server-no-cache'],
        queryFn: serverFn,
        staleTime: 10_000,
      });

      expect(data).toBe('no-cache');
      expect(serverFn).toHaveBeenCalledTimes(1);
    });

    it('ignores meta.astroCache when it has no set function', async () => {
      const serverFn = vi.fn(async () => await Promise.resolve('invalid-cache'));

      const { data } = await useServerQuery({
        queryKey: ['app-server-invalid-cache'],
        queryFn: serverFn,
        staleTime: 10_000,
        meta: { astroCache: { enabled: true } },
      });

      expect(data).toBe('invalid-cache');
      expect(serverFn).toHaveBeenCalledTimes(1);
    });

    it('ignores meta.astroCache when enabled is a non-boolean', async () => {
      const setMock = vi.fn();
      const serverFn = vi.fn(async () => await Promise.resolve('bad-enabled'));

      const { data } = await useServerQuery({
        queryKey: ['app-server-bad-enabled'],
        queryFn: serverFn,
        staleTime: 10_000,
        meta: { astroCache: { enabled: 'yes', set: setMock } },
      });

      expect(data).toBe('bad-enabled');
      expect(setMock).not.toHaveBeenCalled();
    });
  });
});
