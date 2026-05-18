import { describe, expect, it, vi } from 'vitest';
import { mutationOptions } from '@utils/query/mutationOptions';

const preservedQueryFn = async () => await Promise.resolve({ ok: true });

describe('mutationOptions', () => {
  it('returns the same options object passed in', () => {
    const options = {
      queryKey: ['users', 'create'],
      queryFn: async () => await Promise.resolve({ id: '1', name: 'Alice' }),
    };

    const result = mutationOptions(options);

    expect(result).toBe(options);
    expect(result.queryKey).toEqual(['users', 'create']);
  });

  it('preserves all mutation configuration', () => {
    const queryFn = preservedQueryFn;
    const onSuccess = vi.fn();

    const result = mutationOptions({
      queryKey: ['users', 'create'],
      queryFn,
      retry: 2,
      onSuccess,
    });

    expect(result.queryFn).toBe(queryFn);
    expect(result.retry).toBe(2);
    expect(result.onSuccess).toBe(onSuccess);
  });

  it('works with typed generic parameters', () => {
    interface CreateUserResponse {
      item: { id: string; name: string; email: string };
    }

    const result = mutationOptions<CreateUserResponse, Error>({
      queryKey: ['users', 'create'],
      queryFn: async () => await Promise.resolve({
        item: { id: '1', name: 'Alice', email: 'alice@example.com' },
      }),
    });

    expect(result.queryKey).toEqual(['users', 'create']);
  });

  it('supports onSuccess callback for cache invalidation', () => {
    const onSuccess = vi.fn();

    const options = mutationOptions({
      queryKey: ['users', 'create'],
      queryFn: async () => await Promise.resolve({ id: '1' }),
      onSuccess,
    });

    expect(options.onSuccess).toBe(onSuccess);
  });
});
