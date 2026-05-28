import { getStore } from '@netlify/blobs';
import { isUnknownRecord } from '@utils/object/isUnknownRecord';
import type { HeroContact } from '@/types/hero-contact';
import type { UserContact } from '@/types/user-contact';

const DEMO_STORE_NAME = 'astro-ui-demo-contacts';
const HEROES_KEY = 'heroes';
const USERS_KEY = 'users';

const DEFAULT_HEROES: HeroContact[] = [
  { id: 'h-1', name: 'Storm', power: 'Weather control' },
  { id: 'h-2', name: 'Nightcrawler', power: 'Teleportation' },
  { id: 'h-3', name: 'Jean Grey', power: 'Telepathy' },
  { id: 'h-4', name: 'Cyclops', power: 'Optic blasts' },
];

const DEFAULT_USERS: UserContact[] = [
  { id: 'u-1', name: 'Ava Martinez', email: 'ava.martinez@example.com' },
  { id: 'u-2', name: 'Liam Chen', email: 'liam.chen@example.com' },
  { id: 'u-3', name: 'Noah Patel', email: 'noah.patel@example.com' },
  { id: 'u-4', name: 'Sofia Nguyen', email: 'sofia.nguyen@example.com' },
];

const memoryStore = {
  heroes: [...DEFAULT_HEROES],
  users: [...DEFAULT_USERS],
};

let hasLoggedBlobsFallback = false;

/**
 * Reads the heroes demo dataset from durable storage when available.
 *
 * @returns Current hero records from Blobs (or local memory fallback).
 *
 * @example
 * const heroes = await getDemoHeroes();
 */
export async function getDemoHeroes(): Promise<HeroContact[]> {
  return await readCollection<HeroContact>(HEROES_KEY, memoryStore.heroes, isHeroContact);
}

/**
 * Appends one hero to the demo dataset in durable storage.
 *
 * @param hero - Hero item to append.
 * @returns Updated heroes collection.
 *
 * @example
 * const updated = await appendDemoHero({ id: 'h-10', name: 'Rogue', power: 'Power absorption' });
 */
export async function appendDemoHero(hero: HeroContact): Promise<HeroContact[]> {
  return await appendCollection<HeroContact>(HEROES_KEY, memoryStore.heroes, hero, isHeroContact);
}

/**
 * Resets heroes demo dataset back to the default seed values.
 *
 * @returns Reset heroes collection.
 *
 * @example
 * const reset = await resetDemoHeroes();
 */
export async function resetDemoHeroes(): Promise<HeroContact[]> {
  memoryStore.heroes = [...DEFAULT_HEROES];
  const store = resolveBlobStore();

  if (!store) {
    return [...memoryStore.heroes];
  }

  try {
    await store.setJSON(HEROES_KEY, memoryStore.heroes);
    return [...memoryStore.heroes];
  } catch {
    logBlobsFallbackOnce();
    return [...memoryStore.heroes];
  }
}

/**
 * Reads the users demo dataset from durable storage when available.
 *
 * @returns Current user records from Blobs (or local memory fallback).
 *
 * @example
 * const users = await getDemoUsers();
 */
export async function getDemoUsers(): Promise<UserContact[]> {
  return await readCollection<UserContact>(USERS_KEY, memoryStore.users, isUserContact);
}

/**
 * Appends one user to the demo dataset in durable storage.
 *
 * @param user - User item to append.
 * @returns Updated users collection.
 *
 * @example
 * const updated = await appendDemoUser({ id: 'u-10', name: 'Alice', email: 'alice@example.com' });
 */
export async function appendDemoUser(user: UserContact): Promise<UserContact[]> {
  return await appendCollection<UserContact>(USERS_KEY, memoryStore.users, user, isUserContact);
}

/**
 * Reads a typed collection from Blobs, falling back to memory when unavailable.
 *
 * @param key - Storage key used in the shared demo store.
 * @param fallback - In-memory fallback collection and default seed values.
 * @param isItem - Type guard used to validate parsed JSON items.
 * @returns A validated collection value.
 *
 * @example
 * const heroes = await readCollection('heroes', DEFAULT_HEROES, isHeroContact);
 */
async function readCollection<T>(
  key: string,
  fallback: T[],
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  const store = resolveBlobStore();

  if (!store) {
    return [...fallback];
  }

  try {
    const value: unknown = await store.get(key, { type: 'json' });

    if (!isValidCollection(value, isItem)) {
      await store.setJSON(key, fallback);
      return [...fallback];
    }

    return value;
  } catch {
    logBlobsFallbackOnce();
    return [...fallback];
  }
}

/**
 * Appends one item to a collection in Blobs, with memory fallback if needed.
 *
 * @param key - Storage key used in the shared demo store.
 * @param fallback - In-memory fallback collection.
 * @param item - New item to append.
 * @param isItem - Type guard used to validate parsed JSON items.
 * @returns Updated collection after append.
 *
 * @example
 * const users = await appendCollection('users', DEFAULT_USERS, newUser, isUserContact);
 */
async function appendCollection<T>(
  key: string,
  fallback: T[],
  item: T,
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  const store = resolveBlobStore();

  if (!store) {
    fallback.push(item);
    return [...fallback];
  }

  try {
    const existing = await readCollection<T>(key, fallback, isItem);
    const updated = [...existing, item];
    await store.setJSON(key, updated);

    return updated;
  } catch {
    logBlobsFallbackOnce();
    fallback.push(item);

    return [...fallback];
  }
}

/**
 * Gets a Netlify Blobs store handle, or returns null when unavailable.
 *
 * @returns Blobs store instance in supported runtimes, otherwise null.
 *
 * @example
 * const store = resolveBlobStore();
 */
function resolveBlobStore(): ReturnType<typeof getStore> | null {
  try {
    return getStore(DEMO_STORE_NAME);
  } catch {
    logBlobsFallbackOnce();
    return null;
  }
}

/**
 * Validates that an unknown value is a typed array with valid item shapes.
 *
 * @param value - Unknown JSON value read from storage.
 * @param isItem - Type guard that validates each item.
 * @returns True when the value is a valid typed array.
 *
 * @example
 * const valid = isValidCollection(value, isHeroContact);
 */
function isValidCollection<T>(value: unknown, isItem: (entry: unknown) => entry is T): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }

  for (const entry of value) {
    if (!isItem(entry)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for a hero contact payload.
 *
 * @param value - Unknown value to validate.
 * @returns True when the value matches the hero shape.
 *
 * @example
 * const valid = isHeroContact({ id: 'h-1', name: 'Storm', power: 'Weather control' });
 */
function isHeroContact(value: unknown): value is HeroContact {
  return (
    isUnknownRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.power === 'string'
  );
}

/**
 * Type guard for a user contact payload.
 *
 * @param value - Unknown value to validate.
 * @returns True when the value matches the user shape.
 *
 * @example
 * const valid = isUserContact({ id: 'u-1', name: 'Ava Martinez', email: 'ava.martinez@example.com' });
 */
function isUserContact(value: unknown): value is UserContact {
  return (
    isUnknownRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  );
}

/**
 * Logs a single warning when runtime falls back from Blobs to memory.
 *
 * @returns Nothing.
 *
 * @example
 * logBlobsFallbackOnce();
 */
function logBlobsFallbackOnce(): void {
  if (hasLoggedBlobsFallback) {
    return;
  }

  hasLoggedBlobsFallback = true;
  console.warn('[demoContactsStore] Falling back to in-memory contacts store.');
}
