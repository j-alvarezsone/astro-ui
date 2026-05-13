/**
 * Checks whether a value is a non-null object record.
 *
 * @param value - Value to inspect.
 * @returns True when `value` is a plain object-like record.
 *
 * @example
 * const ok = isUnknownRecord({ id: 1 });
 * // true
 */
export function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
