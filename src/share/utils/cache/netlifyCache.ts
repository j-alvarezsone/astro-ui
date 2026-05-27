import type { CacheProviderConfig } from 'astro';

type NetlifyCacheProviderOptions = {
  enabled?: boolean;
  siteId?: string;
  siteSlug?: string;
  authToken?: string;
  apiBaseUrl?: string;
  durable?: boolean;
  debug?: boolean;
  deployAlias?: string;
  domain?: string;
  purgeByPathAsTag?: boolean;
};

export const BASE_URL = 'https://api.netlify.com/api/v1/purge' as const;

/**
 * Build Astro cache-provider config for Netlify CDN caching.
 *
 * @param options - Netlify cache-provider options.
 * @param options.enabled - Whether provider behavior is active.
 * @param options.siteId - Netlify site ID used by the purge API.
 * @param options.siteSlug - Netlify site slug used by the purge API.
 * @param options.authToken - Netlify personal access token for purge API calls.
 * @param options.apiBaseUrl - Purge API endpoint.
 * @param options.durable - Whether to include the durable directive in CDN caching.
 * @param options.debug - Whether to log provider warnings/errors.
 * @param options.deployAlias - Optional deploy alias scope for tag invalidation.
 * @param options.domain - Optional domain scope for tag invalidation.
 * @param options.purgeByPathAsTag - Map `invalidate({ path })` to a synthetic tag.
 * @returns Astro cache-provider config.
 * @example
 * const provider = netlifyCache({
 *   enabled: true,
 *   siteId: process.env.NETLIFY_SITE_ID,
 *   siteSlug: 'my-netlify-site',
 *   authToken: process.env.NETLIFY_AUTH_TOKEN,
 *   apiBaseUrl: 'https://api.netlify.com/api/v1/purge',
 *   durable: true,
 *   debug: process.env.NODE_ENV !== 'production',
 *   deployAlias: 'staging',
 *   domain: 'staging.example.com',
 *   purgeByPathAsTag: true,
 * });
 */
export function netlifyCache(options: NetlifyCacheProviderOptions = {}): CacheProviderConfig<NetlifyCacheProviderOptions> {
  return {
    entrypoint: './src/share/utils/cache/netlifyCache.runtime.ts',
    config: {
      enabled: options.enabled ?? true,
      siteId: options.siteId,
      siteSlug: options.siteSlug,
      authToken: options.authToken,
      apiBaseUrl: options.apiBaseUrl ?? BASE_URL,
      durable: options.durable ?? true,
      debug: options.debug ?? false,
      deployAlias: options.deployAlias,
      domain: options.domain,
      purgeByPathAsTag: options.purgeByPathAsTag ?? true,
    },
  };
}
