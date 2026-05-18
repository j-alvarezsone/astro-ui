import type { CreatePetBody } from '../types/pet-contact';
import type { CreateUserBody } from '../types/user-contact';
import { createPetOptions } from './pets';
import { createUserOptions } from './users';
import { postNewPet } from '../actions/pets';
import { postNewUser } from '../actions/users';

vi.mock('../actions/pets', () => ({
  getAllPets: vi.fn(),
  postNewPet: vi.fn((body: CreatePetBody) => ({
    item: {
      id: 'p-1',
      ...body,
    },
  })),
}));

vi.mock('../actions/users', () => ({
  getAllUser: vi.fn(),
  postNewUser: vi.fn((body: CreateUserBody) => ({
    item: {
      id: 'u-1',
      ...body,
    },
  })),
}));

describe('query mutation options', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes pet payload through context.payload', async () => {
    const payload: CreatePetBody = { name: 'Buddy', type: 'dog' };

    await createPetOptions.queryFn({
      queryKey: createPetOptions.queryKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
      payload,
    });

    expect(postNewPet).toHaveBeenCalledWith(payload);
  });

  it('passes user payload through context.payload', async () => {
    const payload: CreateUserBody = { name: 'Alice', email: 'alice@example.com' };

    await createUserOptions.queryFn({
      queryKey: createUserOptions.queryKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
      payload,
    });

    expect(postNewUser).toHaveBeenCalledWith(payload);
  });

  it('throws when a pet payload is missing', async () => {
    await expect(
      createPetOptions.queryFn({
        queryKey: createPetOptions.queryKey,
        signal: new AbortController().signal,
        attempt: 1,
        client: true,
      }),
    ).rejects.toThrow('Pet payload is required');
  });

  it('throws when a user payload is missing', async () => {
    await expect(
      createUserOptions.queryFn({
        queryKey: createUserOptions.queryKey,
        signal: new AbortController().signal,
        attempt: 1,
        client: true,
      }),
    ).rejects.toThrow('User payload is required');
  });
});
