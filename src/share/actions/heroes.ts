import type { QueryFn } from '@utils/query';
import { isUnknownRecord } from '@utils/object/isUnknownRecord';
import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';
import { resolveBaseUrl } from '@utils/url/resolveBaseUrl';
import type { CreateHeroBody, CreateHeroResponse, GetAllHeroesResponse } from '../types/hero-contact';

/**
 * Fetches all heroes from the API.
 *
 * @param context - Query function context carrying abort signal.
 * @returns The typed heroes list response payload.
 *
 * @example
 * queryOptions({
 *   queryKey: ['heroes'],
 *   queryFn: getAllHeroes,
 * });
 */
export const getAllHeroes: QueryFn<GetAllHeroesResponse> = async ({ signal, meta }) => {
  const baseUrl = resolveBaseUrl(meta);
  const input = baseUrl ? new URL('/api/heroes', baseUrl) : '/api/heroes';

  return await fetchJsonResponse<GetAllHeroesResponse>(
    input,
    {
      init: {
        method: 'GET',
        signal,
      },
      validate: isGetAllHeroesResponse,
    },
  );
};

/**
 * Creates a new hero by sending a POST request to the heroes API.
 *
 * @param body - Hero payload used to create a new hero.
 * @returns The created hero wrapped in the response envelope.
 *
 * @example
 * const created = await postNewHero({ name: 'Storm', power: 'Weather control' });
 */
export async function postNewHero(body: CreateHeroBody): Promise<CreateHeroResponse> {
  return await fetchJsonResponse<CreateHeroResponse>(
    '/api/heroes',
    {
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      validate: isCreateHeroResponse,
    },
  );
}

/**
 * Validates the shape of the heroes list API response.
 *
 * @param value - Unknown JSON value to validate.
 * @returns True when the payload matches the expected heroes list response.
 *
 * @example
 * const isValid = isGetAllHeroesResponse({ items: [{ id: 'h-1', name: 'Storm', power: 'Weather control' }] });
 */
function isGetAllHeroesResponse(value: unknown): value is GetAllHeroesResponse {
  if (!isUnknownRecord(value)) {
    return false;
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    return false;
  }

  for (const item of items) {
    if (!isHeroContactShape(item)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates the shape of a hero item.
 *
 * @param value - Unknown JSON value to validate.
 * @returns True when the value matches the expected hero shape.
 *
 * @example
 * const isValid = isHeroContactShape({ id: 'h-1', name: 'Storm', power: 'Weather control' });
 */
function isHeroContactShape(value: unknown): boolean {
  return isUnknownRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.power === 'string';
}

/**
 * Validates the shape of the hero creation API response.
 *
 * @param value - Unknown JSON value to validate.
 * @returns True when the payload matches the expected create hero response.
 *
 * @example
 * const isValid = isCreateHeroResponse({ item: { id: 'h-1', name: 'Storm', power: 'Weather control' } });
 */
function isCreateHeroResponse(value: unknown): value is CreateHeroResponse {
  if (!isUnknownRecord(value)) {
    return false;
  }

  return isHeroContactShape(value.item);
}
