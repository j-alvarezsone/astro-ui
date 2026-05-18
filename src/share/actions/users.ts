import type { QueryFn } from '@utils/query';
import { isUnknownRecord } from '@utils/object/isUnknownRecord';
import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';
import { resolveBaseUrl } from '@utils/url/resolveBaseUrl';
import type { CreateUserBody, CreateUserResponse, GetAllUserResponse } from '../types/user-contact';

/**
 * Fetches all users from the API.
 *
 * @param context - Query function context carrying abort signal.
 * @returns The typed user list response payload.
 *
 * @example
 * queryOptions({
 *   queryKey: ['users'],
 *   queryFn: getAllUser,
 * });
 */
export const getAllUser: QueryFn<GetAllUserResponse> = async ({ signal, meta }) => {
  const baseUrl = resolveBaseUrl(meta);
  const input = baseUrl ? new URL('/api/users', baseUrl) : '/api/users';

  return await fetchJsonResponse<GetAllUserResponse>(
    input,
    {
      init: {
        method: 'GET',
        signal,
      },
      validate: isGetAllUserResponse,
    },
  );
};

/**
 * Creates a new user by sending a POST request to the users API.
 *
 * @param body - User payload used to create a new user.
 * @returns The created user wrapped in the response envelope.
 *
 * @example
 * const created = await postNewUser({ name: 'Alice', email: 'alice@example.com' });
 */
export async function postNewUser(body: CreateUserBody): Promise<CreateUserResponse> {
  return await fetchJsonResponse<CreateUserResponse>(
    '/api/users',
    {
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      validate: isCreateUserResponse,
    },
  );
}

function isGetAllUserResponse(value: unknown): value is GetAllUserResponse {
  if (!isUnknownRecord(value)) {
    return false;
  }

  const items = value.items;

  if (!Array.isArray(items)) {
    return false;
  }

  for (const item of items) {
    if (!isUserContactShape(item)) {
      return false;
    }
  }

  return true;
}

function isUserContactShape(value: unknown): boolean {
  return isUnknownRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.email === 'string';
}

function isCreateUserResponse(value: unknown): value is CreateUserResponse {
  if (!isUnknownRecord(value)) {
    return false;
  }

  return isUserContactShape(value.item);
}
