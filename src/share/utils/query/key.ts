import type { QueryKey } from '@utils/query/types';

/**
 * Check whether a value is a plain serializable record.
 *
 * @param value - The value to inspect.
 * @returns `true` when the value is a non-null object and not an array.
 * @example
 * ```ts
 * isSerializableRecord({ a: 1 }); // true
 * ```
 */
function isSerializableRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Create a stable hash string for a query key.
 *
 * This function serializes query keys in a deterministic order so that
 * equivalent keys produce the same hash regardless of object property order.
 *
 * @param queryKey - The query key to hash.
 * @returns A deterministic string representation of the query key.
 */
export function hashQueryKey(queryKey: QueryKey): string {
  return stableSerialize(queryKey);
}

/**
 * Serialize a value to JSON after deterministic value sorting.
 *
 * @param value - The input value to serialize.
 * @returns A deterministic JSON string representation.
 * @example
 * ```ts
 * stableSerialize({ b: 2, a: 1 });
 * ```
 */
function stableSerialize(value: unknown): string {
  return JSON.stringify(sortSerializableValue(value));
}

/**
 * Sort serializable values recursively for stable JSON output.
 *
 * @param value - The value to normalize.
 * @returns A recursively sorted value suitable for deterministic serialization.
 * @example
 * ```ts
 * sortSerializableValue({ b: 2, a: 1 });
 * ```
 */
function sortSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortSerializableValue(item));
  }

  if (!isSerializableRecord(value)) {
    return value;
  }

  const entries = Object.entries(value)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, currentValue]) => [key, sortSerializableValue(currentValue)]);

  return Object.fromEntries(entries);
}
