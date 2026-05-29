import type { APIRoute } from 'astro';
import { invalidateServerQuery } from '@utils/query';
import { resetDemoHeroes } from '@utils/data/demoContactsStore';
import type { GetAllHeroesResponse } from '@/types/hero-contact';

// This API route mutates runtime data and invalidates route cache tags, so it must run on demand.
export const prerender = false;

const NO_STORE_HEADERS: HeadersInit = {
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
};

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
    headers: NO_STORE_HEADERS,
  });
};
