import type { APIRoute } from 'astro';
import { sleep } from '@utils/time/sleep';

interface UserContact {
  id: string;
  name: string;
  email: string;
}

interface GetAllUserResponse {
  items: UserContact[];
}

export const prerender = false;

const USERS: UserContact[] = [
  { id: 'u-1', name: 'Ava Martinez', email: 'ava.martinez@example.com' },
  { id: 'u-2', name: 'Liam Chen', email: 'liam.chen@example.com' },
  { id: 'u-3', name: 'Noah Patel', email: 'noah.patel@example.com' },
  { id: 'u-4', name: 'Sofia Nguyen', email: 'sofia.nguyen@example.com' },
];

/**
 * Returns all users.
 *
 * @param _context - Astro API context (unused).
 * @returns JSON payload with all user items.
 *
 * @example
 * // GET /api/users
 * // -> { items: [{ id: 'u-1', name: 'Ava Martinez', email: 'ava.martinez@example.com' }, ...] }
 */
export const GET: APIRoute = async () => {
  await sleep(2500);

  const responsePayload: GetAllUserResponse = { items: USERS };

  return Response.json(responsePayload, { status: 200 });
};
