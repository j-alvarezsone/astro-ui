import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import type { CreateUserResponse, GetAllUserResponse, UserContact } from '../../share/types/user-contact';
import { sleep } from '@utils/time/sleep';
import { invalidateServerQuery } from '@utils/query';
import { appendDemoUser, getDemoUsers } from '@utils/data/demoContactsStore';

export const prerender = false;

let fetchCount = 0;

const createUserBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

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
  const users = await getDemoUsers();
  fetchCount += 1;

  const debugUser: UserContact = {
    id: `u-debug-${fetchCount}`,
    name: `Cache Probe ${fetchCount}`,
    email: `cache-probe-${fetchCount}@example.com`,
  };

  const responsePayload: GetAllUserResponse = {
    items: [...users, debugUser],
  };

  return Response.json(responsePayload, { status: 200 });
};

/**
 * Creates a new user and appends it to the durable demo store.
 *
 * @param context - Astro API context.
 * @returns JSON payload with the created user.
 *
 * @example
 * // POST /api/users  { name: 'Alice', email: 'alice@example.com' }
 * // -> { item: { id: 'u-1234567890', name: 'Alice', email: 'alice@example.com' } }
 */
export const POST: APIRoute = async ({ request }) => {
  await sleep(3000);
  const result = createUserBodySchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return Response.json({ error: 'name and email are required' }, { status: 422 });
  }

  const newUser: UserContact = {
    id: `u-${Date.now()}`,
    name: result.data.name,
    email: result.data.email,
  };

  await appendDemoUser(newUser);

  await invalidateServerQuery({
    queryKey: ['users'],
  });

  const responsePayload: CreateUserResponse = { item: newUser };
  return Response.json(responsePayload, { status: 201 });
};
