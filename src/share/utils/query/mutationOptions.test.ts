import { describe, expect, it, vi } from 'vitest';
import { mutationOptions } from '@utils/query/mutationOptions';

const preservedMutationFn = async () => await Promise.resolve({ ok: true });

describe('mutationOptions', () => {
  it('returns the same options object passed in', () => {
    const options = {
      mutationKey: ['create-users'],
      mutationFn: async () => await Promise.resolve({ id: '1', name: 'Alice' }),
    };

    const result = mutationOptions(options);

    expect(result).toBe(options);
    expect(result.mutationKey).toEqual(['create-users']);
  });

  it('preserves all mutation configuration', () => {
    const mutationFn = preservedMutationFn;
    const onSuccess = vi.fn();

    const result = mutationOptions({
      mutationKey: ['create-users'],
      mutationFn,
      retry: 2,
      onSuccess,
    });

    expect(result.mutationFn).toBe(mutationFn);
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
      mutationKey: ['create-users'],
      mutationFn: async (payload) => {
        if (!payload) {
          throw new Error('Payload is required');
        }

        return await Promise.resolve({
          item: { id: '1', name: payload.name, email: payload.email },
        });
      },
    });

    const response = await result.mutationFn(
      { name: 'Alice', email: 'alice@example.com' },
      {
      queryKey: ['create-users'],
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
      },
    );

    expect(result.mutationKey).toEqual(['create-users']);
    expect(response.item.email).toBe('alice@example.com');
  });

  it('supports onSuccess callback for cache invalidation', () => {
    const onSuccess = vi.fn();

    const options = mutationOptions({
      mutationKey: ['create-users'],
      mutationFn: async () => await Promise.resolve({ id: '1' }),
      onSuccess,
    });

    expect(options.onSuccess).toBe(onSuccess);
  });
});
