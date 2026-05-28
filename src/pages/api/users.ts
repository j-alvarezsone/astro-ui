import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import type { CreateUserResponse, GetAllUserResponse, UserContact } from '../../share/types/user-contact';
import { invalidateServerQuery } from '@utils/query';
import { ApplicationError } from '@utils/error/applicationError';
import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';

export const prerender = false;

const BASE_URL = 'https://mockapihub.com';
const USERS_ENDPOINT = `${BASE_URL}/api/users`;
const runtimeCreatedUsers: UserContact[] = [];

const createUserBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

const mockApiHubUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  email: z.string(),
});

const mockApiHubGetUsersSchema = z.object({
  data: z.array(mockApiHubUserSchema),
});

const mockApiHubCreateUserSchema = z.object({
  data: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    email: z.string().optional(),
  }),
});

/**
 * Converts known application errors into HTTP JSON responses.
 *
 * @param error - Unknown thrown value from upstream fetch/parsing.
 * @param fallbackMessage - Message used when the error is not typed.
 * @returns A JSON response with an appropriate status code.
 * @example
 * return toErrorResponse(error, 'Failed to create user');
 */
function toErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof ApplicationError) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.statusCode,
      },
    );
  }

  return Response.json(
    {
      error: fallbackMessage,
    },
    {
      status: 500,
    },
  );
}

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
  try {
    const parsedUsers = await fetchJsonResponse(USERS_ENDPOINT, {
      validate: (value): value is z.infer<typeof mockApiHubGetUsersSchema> => mockApiHubGetUsersSchema.safeParse(value).success,
    });

    const users: UserContact[] = parsedUsers.data.map((entry) => ({
      id: `u-${entry.id}`,
      name: entry.name,
      email: entry.email,
    }));

    const responsePayload: GetAllUserResponse = {
      items: [...runtimeCreatedUsers, ...users],
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (error: unknown) {
    return toErrorResponse(error, 'Failed to fetch users');
  }
};

/**
 * Creates a new user via the upstream mock API.
 *
 * @param context - Astro API context.
 * @returns JSON payload with the created user.
 *
 * @example
 * // POST /api/users  { name: 'Alice', email: 'alice@example.com' }
 * // -> { item: { id: 'u-1234567890', name: 'Alice', email: 'alice@example.com' } }
 */
export const POST: APIRoute = async ({ request, cache }) => {
  const result = createUserBodySchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return Response.json({ error: 'name and email are required' }, { status: 422 });
  }

  try {
    const createdResponse = await fetchJsonResponse(USERS_ENDPOINT, {
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.data),
      },
      validate: (value): value is z.infer<typeof mockApiHubCreateUserSchema> => mockApiHubCreateUserSchema.safeParse(value).success,
    });

    const newUser: UserContact = {
      id: `u-${createdResponse.data.id ?? Date.now()}`,
      name: createdResponse.data.name ?? result.data.name,
      email: createdResponse.data.email ?? result.data.email,
    };

    runtimeCreatedUsers.unshift(newUser);

    await invalidateServerQuery({
      cache,
      tags: ['users'],
    });

    const responsePayload: CreateUserResponse = { item: newUser };
    return Response.json(responsePayload, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error, 'Failed to create user');
  }
};
