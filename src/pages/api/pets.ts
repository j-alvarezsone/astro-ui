import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import type { CreatePetResponse, GetAllPetsResponse, PetContact } from '../../share/types/pet-contact';
import { sleep } from '@utils/time/sleep';

export const prerender = false;

const PETS: PetContact[] = [
  { id: 'p-1', name: 'Milo', type: 'dog' },
  { id: 'p-2', name: 'Luna', type: 'cat' },
  { id: 'p-3', name: 'Kiwi', type: 'bird' },
];

let fetchCount = 0;

/**
 * Returns all pets.
 *
 * @returns JSON payload with all pet items.
 */
export const GET: APIRoute = () => {
  fetchCount += 1;

  const debugPet: PetContact = {
    id: `p-debug-${fetchCount}`,
    name: `Fetch probe ${fetchCount}`,
    type: 'cat',
  };

  const responsePayload: GetAllPetsResponse = {
    items: [...PETS, debugPet],
  };

  return Response.json(responsePayload, { status: 200 });
};

const createPetBodySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['dog', 'cat', 'bird']),
});

/**
 * Creates a new pet and appends it to the in-memory store.
 *
 * @param context - Astro API context.
 * @returns JSON payload with the created pet.
 *
 * @example
 * // POST /api/pets  { name: 'Buddy', type: 'dog' }
 * // -> { item: { id: 'p-1234567890', name: 'Buddy', type: 'dog' } }
 */
export const POST: APIRoute = async ({ request }) => {
  await sleep(2000)
  const result = createPetBodySchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return Response.json({ error: 'name and a valid type (dog | cat | bird) are required' }, { status: 422 });
  }

  const newPet: PetContact = {
    id: `p-${Date.now()}`,
    name: result.data.name,
    type: result.data.type,
  };

  PETS.push(newPet);

  const responsePayload: CreatePetResponse = { item: newPet };
  return Response.json(responsePayload, { status: 201 });
};
