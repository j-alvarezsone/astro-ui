import type { MutationOptions } from './types';

/**
 * Create a reusable mutation options object for use with useMutationQuery.
 *
 * Mutations differ from queries in that they are triggered explicitly (not auto-run)
 * and typically represent data mutations (POST/PUT/DELETE).
 *
 * @param options - Mutation options including queryKey and mutation function.
 * @param options - Mutation options including mutationKey and mutation function.
 * @returns The mutation options object.
 *
 * @example
 * // In queries/users.ts
 * export const createUserOptions = mutationOptions({
 *   mutationKey: ['users', 'create'],
 *   mutationFn: async (payload) => {
 *    if (!payload) {
 *     throw new Error('User payload is required');
 *   }

 *     return postNewUser(payload);
 *   },
 *   onSuccess: () => invalidateQuery(['users']),
 * });
 *
 * // In a component
 * const mutation = useMutationQuery(createUserOptions);
 * await mutation.mutate({ name: 'Alice', email: 'alice@example.com' });
 */
export const mutationOptions = <TData, TPayload = unknown, TError = unknown>(
  options: MutationOptions<TData, TPayload, TError>,
): MutationOptions<TData, TPayload, TError> => options;
