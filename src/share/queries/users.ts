import type { QueryFn } from '@utils/query';
import { isUnknownRecord } from '@utils/object/isUnknownRecord';
import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';
import type { GetAllUserResponse } from '../api/user-contact';

/**
 * Fetches all users from the API.
 *
 * @param context - Query function context carrying abort signal.
 * @returns The typed user list response payload.
 *
 * @example
 * const data = await getAllUser({
 *   queryKey: ['users'],
 *   signal: new AbortController().signal,
 *   attempt: 1,
 *   client: false,
 * });
 */
export const getAllUser: QueryFn<GetAllUserResponse> = async ({ signal }) => {
  return await fetchJsonResponse<GetAllUserResponse>(
    '/api/users',
    {
      init: {
        method: 'GET',
        signal,
      },
      validate: isGetAllUserResponse,
    },
  );
};

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
