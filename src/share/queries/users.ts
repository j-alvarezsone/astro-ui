import { queryOptions } from '@utils/query/queryOptions';
import { mutationOptions } from '@utils/query/mutationOptions';
import type { CreateUserBody, CreateUserResponse, GetAllUserResponse } from '@/types/user-contact';
import { getAllUser, postNewUser } from '@actions/users';

/**
 * Query options for fetching all users.
 *
 * @example
 * const { data } = await useServerQuery(getAllUsersOptions);
 */
export const getAllUsersOptions = queryOptions<GetAllUserResponse>({
  queryKey: ['users'],
  queryFn: getAllUser,
  staleTime: 10_000,
});

/**
 * Mutation options for creating a new user.
 *
 * @example
 * const mutation = useMutationQuery<CreateUserResponse, CreateUserBody>(createUserOptions);
 * await mutation.mutate({ name: 'Alice', email: 'alice@example.com' });
 */
export const createUserOptions = mutationOptions<CreateUserResponse, CreateUserBody>({
  queryKey: ['users', 'create'],
  queryFn: async (context) => {
    if (!context.payload) {
      throw new Error('User payload is required');
    }

    return await postNewUser(context.payload);
  },
});
