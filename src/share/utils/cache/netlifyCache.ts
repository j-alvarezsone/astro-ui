import type { CacheProviderConfig } from 'astro';

type NetlifyCacheProviderOptions = {
  enabled?: boolean;
  siteId?: string;
  purgeToken?: string;
  apiBaseUrl?: string;
  durable?: boolean;
  debug?: boolean;
  purgeByPathAsTag?: boolean;
  strictMissingCredentials?: boolean;
};

export const BASE_URL = 'https://api.netlify.com/api/v1/purge' as const;

/**
 * Build Astro cache-provider config for Netlify CDN caching.
 *
 * @param options - Netlify cache-provider options.
 * @param options.enabled - Whether provider behavior is active.
 * @param options.siteId - Netlify site ID used by the purge API.
 * @param options.purgeToken - Netlify purge API token for purge API calls.
 * @param options.apiBaseUrl - Purge API endpoint.
 * @param options.durable - Whether to include the durable directive in CDN caching.
 * @param options.debug - Whether to log provider warnings/errors.
 * @param options.purgeByPathAsTag - Map `invalidate({ path })` to a synthetic tag.
 * @param options.strictMissingCredentials - Throw when purge credentials are missing instead of skipping invalidation.
 * @returns Astro cache-provider config.
 * @example
 * const provider = netlifyCache({
 *   enabled: true,
 *   siteId: process.env.NETLIFY_SITE_ID,
 *   purgeToken: process.env.NETLIFY_AUTH_TOKEN,
 *   apiBaseUrl: 'https://api.netlify.com/api/v1/purge',
 *   durable: true,
 *   debug: process.env.NODE_ENV !== 'production',
 *   purgeByPathAsTag: true,
 *   strictMissingCredentials: process.env.CONTEXT === 'production',
 * });
 */
export function netlifyCache(options: NetlifyCacheProviderOptions = {}): CacheProviderConfig<NetlifyCacheProviderOptions> {
  return {
    entrypoint: './src/share/utils/cache/netlifyCache.runtime.ts',
    config: {
      enabled: options.enabled ?? true,
      siteId: options.siteId,
      purgeToken: options.purgeToken,
      apiBaseUrl: options.apiBaseUrl ?? BASE_URL,
      durable: options.durable ?? false,
      debug: options.debug ?? false,
      purgeByPathAsTag: options.purgeByPathAsTag ?? true,
      strictMissingCredentials: options.strictMissingCredentials ?? false,
    },
  };
}
