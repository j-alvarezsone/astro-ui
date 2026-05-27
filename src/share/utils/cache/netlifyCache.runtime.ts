import type { CacheOptions, CacheProviderFactory, InvalidateOptions } from 'astro';
import { BASE_URL } from './netlifyCache';

type NetlifyCacheProviderRuntimeConfig = {
  enabled?: boolean;
  siteId?: string;
  siteSlug?: string;
  purgeToken?: string;
  apiBaseUrl?: string;
  durable?: boolean;
  debug?: boolean;
  deployAlias?: string;
  domain?: string;
  purgeByPathAsTag?: boolean;
};

type PurgePayloadScope = {
  key: 'domain' | 'site_id' | 'site_slug';
  value: string;
};

/**
 * Normalize cache tags from Astro invalidate options.
 *
 * @param tags - Tag input from Astro invalidate options.
 * @returns A normalized list of non-empty tags.
 * @example
 * normalizeTags(['users', ' posts ']);
 */
function normalizeTags(tags: InvalidateOptions['tags']): string[] {
  if (!tags) {
    return [];
  }

  const values = Array.isArray(tags) ? tags : [tags];

  return values.map((tag) => tag.trim()).filter(Boolean);
}

/**
 * Build Netlify and CDN cache-control values from Astro cache options.
 *
 * @param options - Cache options from Astro route cache.
 * @param durable - Whether to include the Netlify `durable` directive.
 * @returns Header values for Netlify and generic CDN caches.
 * @example
 * buildCacheControlValues({ maxAge: 60, swr: 120 }, true);
 */
function buildCacheControlValues(
  options: CacheOptions,
  durable: boolean,
): {
  netlify: string;
  cdn: string;
} {
  const directives = ['public'];
  if (durable) {
    directives.push('durable');
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.swr !== undefined) {
    directives.push(`stale-while-revalidate=${options.swr}`);
  }

  const netlify = directives.join(', ');
  const cdn = directives.filter((directive) => directive !== 'durable').join(', ');

  return { netlify, cdn };
}

/**
 * Resolve the most specific Netlify purge scope available for this config.
 *
 * Domain takes priority for preview deploys, then site slug, then site ID.
 *
 * @param config - Netlify provider runtime configuration.
 * @returns The purge scope key/value pair or `undefined` when no scope exists.
 */
function resolvePurgePayloadScope(config: NetlifyCacheProviderRuntimeConfig): PurgePayloadScope | undefined {
  if (config.domain) {
    return { key: 'domain', value: config.domain };
  }

  if (config.siteSlug) {
    return { key: 'site_slug', value: config.siteSlug };
  }

  if (config.siteId) {
    return { key: 'site_id', value: config.siteId };
  }

  return undefined;
}

/**
 * Build request payload for Netlify purge API.
 *
 * @param config - Netlify provider runtime configuration.
 * @param tags - Cache tags to invalidate.
 * @returns A Netlify purge request payload.
 * @example
 * buildPurgePayload({ siteId: 'abc' }, ['users']);
 */
function buildPurgePayload(config: NetlifyCacheProviderRuntimeConfig, tags: string[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    cache_tags: tags,
  };

  if (config.deployAlias) {
    payload.deploy_alias = config.deployAlias;
  }

  const scope = resolvePurgePayloadScope(config);
  if (scope) {
    payload[scope.key] = scope.value;
  }

  return payload;
}

/**
 * Create a Netlify-backed Astro cache provider.
 *
 * This provider maps Astro route-cache hints to Netlify cache headers and
 * supports tag-based invalidation via the Netlify purge API.
 *
 * @param rawConfig - Serialized provider config from `astro.config.*`.
 * @returns Astro cache provider implementation.
 * @example
 * const provider = netlifyCacheProviderFactory({ siteId: 'site-id', purgeToken: 'token' });
 */
const netlifyCacheProviderFactory: CacheProviderFactory<NetlifyCacheProviderRuntimeConfig> = (rawConfig) => {
  const config: NetlifyCacheProviderRuntimeConfig = {
    ...rawConfig,
    enabled: rawConfig?.enabled ?? true,
    apiBaseUrl: rawConfig?.apiBaseUrl ?? BASE_URL,
    durable: rawConfig?.durable ?? true,
    debug: rawConfig?.debug ?? false,
    purgeByPathAsTag: rawConfig?.purgeByPathAsTag ?? true,
  };

  return {
    name: 'netlify-cache-provider',
    setHeaders(options: CacheOptions): Headers {
      const headers = new Headers();
      const { netlify, cdn } = buildCacheControlValues(options, config.durable ?? true);

      headers.set('Netlify-CDN-Cache-Control', netlify);
      headers.set('CDN-Cache-Control', cdn);

      if (options.tags?.length) {
        const tagHeader = options.tags.join(',');
        headers.set('Netlify-Cache-Tag', tagHeader);
        headers.set('Cache-Tag', tagHeader);
      }

      return headers;
    },
    async invalidate(options: InvalidateOptions): Promise<void> {
      if (config.enabled === false) {
        return;
      }

      const tags = normalizeTags(options.tags);
      if (options.path && config.purgeByPathAsTag) {
        tags.push(`path:${options.path}`);
      }

      if (!tags.length) {
        if (config.debug) {
          console.warn('[netlify-cache-provider] Skipping invalidate without tags.');
        }

        return;
      }

      if (!config.purgeToken || (!config.siteId && !config.siteSlug)) {
        if (config.debug) {
          console.warn('[netlify-cache-provider] Missing purgeToken and siteId/siteSlug. Invalidation request skipped.');
        }

        return;
      }

      const response = await fetch(config.apiBaseUrl!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.purgeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPurgePayload(config, [...new Set(tags)])),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Netlify purge failed (${response.status} ${response.statusText}): ${body}`);
      }
    },
  };
};

export default netlifyCacheProviderFactory;
