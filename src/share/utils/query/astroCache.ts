import { hashQueryKey } from '@utils/query/key';
import type { AstroCacheBridgeOptions, AstroRouteCacheSetOptions } from '@utils/query/types';

/**
 * Apply Astro route cache directives when an Astro cache bridge is available.
 *
 * If the route cache is disabled or no explicit cache directives are provided,
 * this helper returns `false` without mutating the cache.
 *
 * @param options - Astro cache bridge options to evaluate and apply.
 * @returns `true` when route cache directives were applied, otherwise `false`.
 * @example
 * ```ts
 * applyAstroRouteCache({
 *   cache: astroCache,
 *   queryKey: ['product', '123'],
 *   maxAge: 30_000,
 *   swr: 60_000,
 *   tags: ['products'],
 * });
 * ```
 */
export function applyAstroRouteCache(options: AstroCacheBridgeOptions): boolean {
  const { cache, maxAge, swr, tags, queryKey } = options;

  if (!cache || cache.enabled === false) {
    return false;
  }

  const maxAgeSeconds = toMaxAgeSeconds(maxAge);
  const hasExplicitDirectives = maxAgeSeconds !== undefined || swr !== undefined || Boolean(tags?.length);

  if (!hasExplicitDirectives) {
    return false;
  }

  const mergedTags = mergeTags(tags, queryKey);
  const cacheOptions: AstroRouteCacheSetOptions = {
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
    ...(swr !== undefined ? { swr: toSwrSeconds(swr) } : {}),
    ...(mergedTags.length ? { tags: mergedTags } : {}),
  };

  cache.set(cacheOptions);

  return true;
}

/**
 * Convert a query stale time value into a route cache max-age value.
 *
 * Returns `undefined` for `static` and `Infinity` so Astro can treat the
 * result as a non-expiring route cache entry.
 *
 * @param maxAge - The route max-age value from cache bridge options.
 * @returns A max-age in seconds or `undefined` for non-expiring values.
 * @example
 * ```ts
 * toMaxAgeSeconds(30_000); // 30
 * toMaxAgeSeconds('static'); // undefined
 * ```
 */
export function toMaxAgeSeconds(maxAge: AstroCacheBridgeOptions['maxAge']): number | undefined {
  if (maxAge === undefined) {
    return undefined;
  }

  if (maxAge === 'static' || maxAge === Number.POSITIVE_INFINITY) {
    return undefined;
  }

  if (maxAge <= 0) {
    return 0;
  }

  return Math.floor(maxAge / 1000);
}

/**
 * Convert a query SWR duration from milliseconds to Astro route-cache seconds.
 *
 * Astro route caching expects `swr` in seconds, while the query layer uses
 * millisecond durations to stay consistent with `staleTime`.
 *
 * @param swr - SWR duration in milliseconds from query options.
 * @returns A non-negative SWR duration in seconds.
 * @example
 * ```ts
 * toSwrSeconds(60_000); // 60
 * ```
 */
export function toSwrSeconds(swr: number): number {
  if (swr <= 0) {
    return 0;
  }

  return Math.floor(swr / 1000);
}

/**
 * Merge explicit cache tags with a query-derived tag for cache invalidation.
 *
 * The returned tag list is de-duplicated and ignores empty or whitespace-only tags.
 *
 * @param tags - Optional explicit cache tags.
 * @param queryKey - Query key used to derive a query-specific cache tag.
 * @returns Normalized and deduplicated cache tags.
 * @example
 * ```ts
 * mergeTags(['products'], ['product', '123']);
 * ```
 */
export function mergeTags(tags: string[] | undefined, queryKey: AstroCacheBridgeOptions['queryKey']): string[] {
  const allTags = [...(tags ?? [])]
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (queryKey !== undefined) {
    allTags.push(`query:${hashQueryKey(queryKey)}`);
  }

  return [...new Set(allTags)];
}
