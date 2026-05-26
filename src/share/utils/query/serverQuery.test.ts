import { createServerQuery } from '@utils/query/serverQuery';
import type { ServerQueryOptions } from '@utils/query/types';

describe('server query adapter', () => {
  it('accepts explicit query mode while keeping route-only options exclusive', () => {
    const queryModeOptions: ServerQueryOptions<string> = {
      queryKey: ['server-explicit-query-mode'],
      queryFn: async () => await Promise.resolve('query-ok'),
      cacheMode: 'query',
    };
    const routeModeOptions: ServerQueryOptions<string> = {
      queryFn: async () => await Promise.resolve('route-ok'),
      cacheMode: 'route',
      routeCache: {
        cache: {
          enabled: true,
          set: vi.fn(),
        },
      },
    };

    expect(queryModeOptions.cacheMode).toBe('query');
    expect(routeModeOptions.cacheMode).toBe('route');

    // @ts-expect-error Route cache options are only valid when cacheMode is "route".
    const invalidQueryModeOptions: ServerQueryOptions<string> = {
      queryKey: ['server-invalid-query-mode'],
      queryFn: async () => await Promise.resolve('invalid'),
      cacheMode: 'query',
      routeCache: {
        cache: {
          set: vi.fn(),
        },
      },
    };

    expect(invalidQueryModeOptions).toBeDefined();
  });

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
