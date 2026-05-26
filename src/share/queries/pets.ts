import { queryOptions } from '@utils/query/queryOptions';
import { mutationOptions } from '@utils/query/mutationOptions';
import { invalidateQuery } from '@utils/query';
import type { CreatePetBody, CreatePetResponse } from '../types/pet-contact';
import { getAllPets, postNewPet } from '../actions/pets';

/**
 * Query options for fetching all pets.
 *
 * @example
 * const { data } = await useServerQuery(getAllPetsOptions);
 */
export const getAllPetsOptions = queryOptions({
  queryKey: ['pets'],
  queryFn: getAllPets,
  staleTime: 3_000,
});

/**
 * Mutation options for creating a new pet.
 *
 * @example
 * const mutation = useMutationQuery<CreatePetResponse, CreatePetBody>(createPetOptions);
 * await mutation.mutate({ name: 'Buddy', type: 'dog' });
 */
export const createPetOptions = mutationOptions<CreatePetResponse, CreatePetBody>({
  queryKey: ['pets', 'create'],
  queryFn: async (context) => {
    if (!context.payload) {
      throw new Error('Pet payload is required');
    }

    return await postNewPet(context.payload);
  },
  onSuccess: () => {
    invalidateQuery(['pets']);
  },
});
