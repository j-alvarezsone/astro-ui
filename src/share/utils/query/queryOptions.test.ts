import { describe, expect, it } from 'vitest';
import { queryOptions } from '@utils/query/queryOptions';

const preservedQueryFn = async () => await Promise.resolve({ ok: true });

describe('queryOptions', () => {
  it('returns the same options object passed in', () => {
    const options = {
      queryKey: ['test'],
      queryFn: async () => await Promise.resolve({ data: 'test' }),
      staleTime: 5_000,
    };

    const result = queryOptions(options);

    expect(result).toBe(options);
    expect(result.queryKey).toEqual(['test']);
    expect(result.staleTime).toBe(5_000);
  });

  it('preserves all query configuration', () => {
    const queryFn = preservedQueryFn;

    const result = queryOptions({
      queryKey: ['users'],
      queryFn,
      staleTime: 10_000,
      retry: 3,
    });

    expect(result.queryFn).toBe(queryFn);
    expect(result.staleTime).toBe(10_000);
    expect(result.retry).toBe(3);
  });

  it('works with typed generic parameters', () => {
    interface User {
      id: string;
      name: string;
    }

    const result = queryOptions<User>({
      queryKey: ['user', 1],
      queryFn: async () => await Promise.resolve({ id: '1', name: 'Alice' }),
    });

    expect(result.queryKey).toEqual(['user', 1]);
  });
});
