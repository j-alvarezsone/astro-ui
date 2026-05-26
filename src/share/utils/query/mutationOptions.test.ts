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

  it('supports explicit response and payload generic parameters', async () => {
    interface CreateUserResponse {
      item: { id: string; name: string; email: string };
    }

    interface CreateUserPayload {
      name: string;
      email: string;
    }

    const result = mutationOptions<CreateUserResponse, CreateUserPayload>({
      queryKey: ['users', 'create'],
      queryFn: async (context) => {
        const payload = context.payload;

        if (!payload) {
          throw new Error('Payload is required');
        }

        return await Promise.resolve({
          item: { id: '1', name: payload.name, email: payload.email },
        });
      },
    });

    const response = await result.queryFn({
      queryKey: ['users', 'create'],
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
      payload: { name: 'Alice', email: 'alice@example.com' },
    });

    expect(result.queryKey).toEqual(['users', 'create']);
    expect(response.item.email).toBe('alice@example.com');
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
