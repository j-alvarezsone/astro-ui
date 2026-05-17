/**
 * Extracts a valid base URL from an unknown record, typically passed via
 * query `meta`. Returns the value only if it is a `string` or `URL` instance.
 *
 * **Why this is needed for SSR:** Node.js cannot resolve relative URLs in
 * `fetch()` — unlike browsers, there is no implicit origin. Passing
 * `Astro.url` as `meta.baseUrl` lets query functions build an absolute URL
 * (e.g. `new URL('/api/users', baseUrl)`) when running server-side, while
 * falling back to a relative path on the client where the browser supplies
 * the origin automatically.
 *
 * @param meta - Arbitrary metadata object, usually from a query context.
 * @returns The `baseUrl` value when it is a `string` or `URL`, otherwise `undefined`.
 *
 * @example
 * resolveBaseUrl({ baseUrl: 'http://localhost:4321' });
 * // → 'http://localhost:4321'
 *
 * resolveBaseUrl({ baseUrl: new URL('http://localhost:4321') });
 * // → URL { href: 'http://localhost:4321/' }
 *
 * resolveBaseUrl(undefined);
 * // → undefined
 */
export function resolveBaseUrl(meta: Record<string, unknown> | undefined): string | URL | undefined {
  const baseUrl = meta?.baseUrl;

  if (typeof baseUrl === 'string' || baseUrl instanceof URL) {
    return baseUrl;
  }

  return undefined;
}
