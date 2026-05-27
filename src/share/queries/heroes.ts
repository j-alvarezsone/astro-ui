import { queryOptions } from '@utils/query/queryOptions';
import { mutationOptions } from '@utils/query/mutationOptions';
import type { CreateHeroBody, CreateHeroResponse } from '@/types/hero-contact';
import { getAllHeroes, postNewHero } from '@actions/heroes';

/**
 * Query options for fetching all heroes.
 *
 * @example
 * const { data } = await useServerQuery(getAllHeroesOptions);
 */
export const getAllHeroesOptions = queryOptions({
  queryKey: ['heroes'],
  queryFn: getAllHeroes,
  staleTime: 3000,
});

/**
 * Mutation options for creating a new hero.
 *
 * @example
 * const mutation = useMutationQuery<CreateHeroResponse, CreateHeroBody>(createHeroOptions);
 * await mutation.mutate({ name: 'Storm', power: 'Weather control' });
 */
export const createHeroOptions = mutationOptions<CreateHeroResponse, CreateHeroBody>({
  queryKey: ['heroes', 'create'],
  queryFn: async (context) => {
    if (!context.payload) {
      throw new Error('Hero payload is required');
    }

    return await postNewHero(context.payload);
  },
});
