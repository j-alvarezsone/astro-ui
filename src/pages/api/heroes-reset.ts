import type { APIRoute } from 'astro';
import { invalidateServerQuery } from '@utils/query';
import { resetDemoHeroes } from '@utils/data/demoContactsStore';
import type { GetAllHeroesResponse } from '@/types/hero-contact';

export const prerender = false;

/**
 * Resets heroes data to the default seed list.
 *
 * @param context - Astro API context.
 * @returns JSON payload with reset hero items.
 *
 * @example
 * // POST /api/heroes-reset
 * // -> { items: [{ id: 'h-1', name: 'Storm', power: 'Weather control' }, ...] }
 */
export const POST: APIRoute = async ({ cache }) => {
  const heroes = await resetDemoHeroes();

  await invalidateServerQuery({
    cache,
    tags: ['heroes'],
    path: '/query-system/server-route-query',
  });

  const responsePayload: GetAllHeroesResponse = { items: heroes };
  return Response.json(responsePayload, {
    status: 200,
  });
};
