import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import type { CreateHeroResponse, GetAllHeroesResponse, HeroContact } from '../../share/types/hero-contact';
import { sleep } from '@utils/time/sleep';
import { invalidateServerQuery } from '@utils/query';

export const prerender = false;

const HEROES: HeroContact[] = [
  { id: 'h-1', name: 'Storm', power: 'Weather control' },
  { id: 'h-2', name: 'Nightcrawler', power: 'Teleportation' },
  { id: 'h-3', name: 'Jean Grey', power: 'Telepathy' },
  { id: 'h-4', name: 'Cyclops', power: 'Optic blasts' },
];

let fetchCount = 0;

const createHeroBodySchema = z.object({
  name: z.string().min(1),
  power: z.string().min(1),
});

/**
 * Returns all heroes.
 *
 * @returns JSON payload with all hero items.
 *
 * @example
 * // GET /api/heroes
 * // -> { items: [{ id: 'h-1', name: 'Storm', power: 'Weather control' }, ...] }
 */
export const GET: APIRoute = () => {
  fetchCount += 1;

  const debugHero: HeroContact = {
    id: `h-debug-${fetchCount}`,
    name: `Route Probe ${fetchCount}`,
    power: 'Cache validation marker',
  };

  const responsePayload: GetAllHeroesResponse = {
    items: [...HEROES, debugHero],
  };

  return Response.json(responsePayload, { status: 200 });
};

/**
 * Creates a new hero and appends it to the in-memory store.
 *
 * @param context - Astro API context.
 * @returns JSON payload with the created hero.
 *
 * @example
 * // POST /api/heroes { name: 'Rogue', power: 'Power absorption' }
 * // -> { item: { id: 'h-1234567890', name: 'Rogue', power: 'Power absorption' } }
 */
export const POST: APIRoute = async ({ request, cache }) => {
  await sleep(3000);
  const result = createHeroBodySchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return Response.json({ error: 'name and power are required' }, { status: 422 });
  }

  const newHero: HeroContact = {
    id: `h-${Date.now()}`,
    name: result.data.name,
    power: result.data.power,
  };

  HEROES.push(newHero);

  await invalidateServerQuery({
    queryKey: ['heroes'],
    cache,
    tags: ['heroes'],
  });

  const responsePayload: CreateHeroResponse = { item: newHero };
  return Response.json(responsePayload, { status: 201 });
};
