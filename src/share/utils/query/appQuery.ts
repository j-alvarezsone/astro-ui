import { createClientQuery } from './clientQuery';
import { createServerQuery } from './serverQuery';


const clientQuery = createClientQuery({
  defaultRetry: 3,
});

const serverQuery = createServerQuery({
  defaultRetry: 3,
});

type ClientCreateQuery = typeof clientQuery.createQuery;
type ServerCreateQuery = typeof serverQuery.createQuery;
type ClientInvalidate = typeof clientQuery.invalidate;

/**
 * Create a client query controller using the shared client query instance.
 *
 * @param args - Arguments forwarded to the shared client query creator.
 * @returns A client query controller instance.
 */
export const useClientQuery: ClientCreateQuery = (...args) => clientQuery.createQuery(...args);

/**
 * Create a server query controller using the shared server query instance.
 *
 * @param args - Arguments forwarded to the shared server query creator.
 * @returns A server query controller instance.
 */
export const useServerQuery: ServerCreateQuery = (...args) => serverQuery.createQuery(...args);

/**
 * Remove a cached client query entry by query key.
 *
 * @param args - The query key arguments used to remove a cache entry.
 * @returns `true` when the cache entry existed and was removed.
 */
export const invalidateQuery: ClientInvalidate = (...args) => clientQuery.invalidate(...args);

/**
 * Clear the shared client query cache entirely.
 *
 * @returns void.
 */
export const clearClientQueryCache = (): void => clientQuery.clear();
