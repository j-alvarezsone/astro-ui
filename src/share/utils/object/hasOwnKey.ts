/**
 * Checks whether an object has the provided key as its own property.
 *
 * @param target - Object to inspect.
 * @param key - Property key to check.
 * @returns True when `key` exists directly on `target`.
 *
 * @example
 * const hasTheme = hasOwnKey({ warm: true }, 'warm');
 * // true
 */
export function hasOwnKey<T extends object>(target: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(target, key);
}
