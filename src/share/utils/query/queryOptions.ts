import type { QueryOptions } from './types';

/**
 * Create a reusable query options object that can be passed to useClientQuery or useServerQuery.
 *
 * This pattern follows TanStack Query's queryOptions API, allowing you to colocate
 * query configuration with query functions in a single, reusable export.
 *
 * @param options - Query options including queryKey, queryFn, and other configuration.
 * @returns The query options object, suitable for useClientQuery or useServerQuery.
 *
 * @example
 * // In queries/users.ts
 * export const getAllUsersOptions = queryOptions({
 *   queryKey: ['users'],
 *   queryFn: getAllUsers,
 *   staleTime: 10_000,
 * });
 *
 * // In a page or component
 * const { data } = await useServerQuery(getAllUsersOptions);
 * // or
 * const query = useClientQuery(getAllUsersOptions);
 */
export const queryOptions = <
  TData,
  TError = unknown,
  TOptions extends QueryOptions<TData, TError> = QueryOptions<TData, TError>,
>(
  options: TOptions,
): TOptions => options;
