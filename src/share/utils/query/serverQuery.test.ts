import { createServerQuery } from '@utils/query/serverQuery';
import type { ServerQueryOptions } from '@utils/query/types';

describe('server query adapter', () => {
  it('accepts route-only options without cacheMode', () => {
    const routeModeOptions: ServerQueryOptions<string> = {
      queryFn: async () => await Promise.resolve('route-ok'),
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
    };

    expect(routeModeOptions.routeCache.cache.enabled).toBe(true);
  });

  it('execute and refetch both run uncached route executions', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const server = createServerQuery();
    const query = server.createQuery({
      queryFn,
      autoExecute: false,
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
    });

    await query.execute();
    await query.execute();

    expect(queryFn).toHaveBeenCalledTimes(2);

    const refetchResult = await query.refetch();

    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(refetchResult.data).toBe(3);
    expect(refetchResult.isSuccess).toBe(true);
  });

  it('exposes error state and value when query execution fails', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();
      throw new Error('server boom');
    });

    const server = createServerQuery();
    const query = server.createQuery({
      queryFn,
      autoExecute: false,
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
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

  it('clear keeps route-only behavior as uncached execution', async () => {
    const queryFn = vi.fn(async () => {
      await Promise.resolve();

      return queryFn.mock.calls.length;
    });

    const server = createServerQuery();

    const queryA = server.createQuery({
      queryFn,
      autoExecute: false,
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
    });

    await queryA.execute();
    await queryA.execute();

    expect(queryFn).toHaveBeenCalledTimes(2);

    server.clear();

    const queryB = server.createQuery({
      queryFn,
      autoExecute: false,
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
    });

    const secondResult = await queryB.execute();

    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(secondResult.data).toBe(3);
  });
});
