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

  it('passes pet payload through mutationFn', async () => {
    const payload: CreatePetBody = { name: 'Buddy', type: 'dog' };

    await createPetOptions.mutationFn(payload, {
      queryKey: createPetOptions.mutationKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
    });

    expect(postNewPet).toHaveBeenCalledWith(payload);
  });

  it('passes user payload through mutationFn', async () => {
    const payload: CreateUserBody = { name: 'Alice', email: 'alice@example.com' };

    await createUserOptions.mutationFn(payload, {
      queryKey: createUserOptions.mutationKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
    });

    expect(postNewUser).toHaveBeenCalledWith(payload);
  });

  it('throws when pet payload is missing', async () => {
    await expect(createPetOptions.mutationFn(undefined, {
      queryKey: createPetOptions.mutationKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
    })).rejects.toThrow('Pet payload is required');
  });

  it('throws when user payload is missing', async () => {
    await expect(createUserOptions.mutationFn(undefined, {
      queryKey: createUserOptions.mutationKey,
      signal: new AbortController().signal,
      attempt: 1,
      client: true,
    })).rejects.toThrow('User payload is required');
  });
});
