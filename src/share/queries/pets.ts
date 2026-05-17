import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';
import { isUnknownRecord } from '@utils/object/isUnknownRecord';
import type { QueryFn } from '@utils/query';
import { z } from 'astro/zod';
import type { CreatePetBody, CreatePetResponse, GetAllPetsResponse } from '../types/pet-contact';

/**
 * Fetches all pets from the API.
 *
 * @param context - Query function context carrying abort signal.
 * @returns The typed pets response payload.
 */
export const getAllPets: QueryFn<GetAllPetsResponse> = async ({ signal }) => {
  return await fetchJsonResponse<GetAllPetsResponse>('/api/pets', {
    init: {
      method: 'GET',
      signal,
    },
    validate: isGetAllPetsResponse,
  });
};

function isGetAllPetsResponse(value: unknown): value is GetAllPetsResponse {
  if (!isUnknownRecord(value)) {
    return false;
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    return false;
  }

  for (const item of items) {
    if (!isPetContactShape(item)) {
      return false;
    }
  }

  return true;
}

function isPetContactShape(value: unknown): boolean {
  if (!isUnknownRecord(value)) {
    return false;
  }

  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && (value.type === 'dog' || value.type === 'cat' || value.type === 'bird');
}

const createPetResponseSchema = z.object({
  item: z.object({ id: z.string(), name: z.string(), type: z.enum(['dog', 'cat', 'bird']) }),
});

/**
 * Sends a POST request to create a new pet.
 *
 * @param body - The pet data to create.
 * @returns The created pet wrapped in a response envelope.
 *
 * @example
 * const result = await postNewPet({ name: 'Buddy', type: 'dog' });
 * // -> { item: { id: 'p-1234567890', name: 'Buddy', type: 'dog' } }
 */
export async function postNewPet(body: CreatePetBody): Promise<CreatePetResponse> {
  const response = await fetch('/api/pets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to add pet');
  }

  return createPetResponseSchema.parse(await response.json());
}
