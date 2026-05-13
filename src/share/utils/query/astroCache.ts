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
 *   staleTime: 30_000,
 *   swr: 60_000,
 *   tags: ['products'],
 * });
 * ```
 */
export function applyAstroRouteCache(options: AstroCacheBridgeOptions): boolean {
  const { cache, staleTime, swr, tags, queryKey } = options;

  if (!cache || cache.enabled === false) {
    return false;
  }

  const maxAge = toMaxAgeSeconds(staleTime);
  const hasExplicitDirectives = maxAge !== undefined || swr !== undefined || Boolean(tags?.length);

  if (!hasExplicitDirectives) {
    return false;
  }

  const mergedTags = mergeTags(tags, queryKey);
  const cacheOptions: AstroRouteCacheSetOptions = {
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(swr !== undefined ? { swr: Math.max(0, Math.floor(swr)) } : {}),
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
 * @param staleTime - The query stale time value from cache bridge options.
 * @returns A max-age in seconds or `undefined` for non-expiring values.
 * @example
 * ```ts
 * toMaxAgeSeconds(30_000); // 30
 * toMaxAgeSeconds('static'); // undefined
 * ```
 */
export function toMaxAgeSeconds(staleTime: AstroCacheBridgeOptions['staleTime']): number | undefined {
  if (staleTime === undefined) {
    return undefined;
  }

  if (staleTime === 'static' || staleTime === Number.POSITIVE_INFINITY) {
    return undefined;
  }

  if (staleTime <= 0) {
    return 0;
  }

  return Math.floor(staleTime / 1000);
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
  const queryTag = `query:${hashQueryKey(queryKey)}`;
  const allTags = [...(tags ?? []), queryTag]
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [...new Set(allTags)];
}