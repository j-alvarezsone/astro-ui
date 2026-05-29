import type { CacheOptions, CacheProviderFactory, InvalidateOptions } from 'astro';
import { BASE_URL } from './netlifyCache';

type NetlifyCacheProviderRuntimeConfig = {
  enabled?: boolean;
  siteId?: string;
  purgeToken?: string;
  apiBaseUrl?: string;
  durable?: boolean;
  debug?: boolean;
  purgeByPathAsTag?: boolean;
  strictMissingCredentials?: boolean;
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
  browser: string;
} {
  const directives = ['public'];
  if (durable) {
    directives.push('durable');
  }

  if (options.maxAge !== undefined) {
    directives.push(`s-maxage=${options.maxAge}`);
  }

  if (options.swr !== undefined) {
    directives.push(`stale-while-revalidate=${options.swr}`);
  }

  const netlify = directives.join(', ');
  const cdn = directives.filter((directive) => directive !== 'durable').join(', ');
  const browser = 'public, max-age=0, must-revalidate';

  return { netlify, cdn, browser };
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
  const payload: Record<string, unknown> = { cache_tags: tags };

  if (config.siteId) {
    payload.site_id = config.siteId;
  }

  return payload;
}

/**
 * Build a lightweight diagnostics object for provider debug logs.
 *
 * @param config - Netlify provider runtime configuration.
 * @param tags - Normalized cache tags for invalidation.
 * @returns A serializable diagnostics payload safe for logs.
 */
function buildDiagnostics(config: NetlifyCacheProviderRuntimeConfig, tags: string[]): Record<string, unknown> {
  return {
    apiBaseUrl: config.apiBaseUrl,
    tags,
    hasSiteId: Boolean(config.siteId),
    hasPurgeToken: Boolean(config.purgeToken),
  };
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
    durable: rawConfig?.durable ?? false,
    debug: rawConfig?.debug ?? false,
    purgeByPathAsTag: rawConfig?.purgeByPathAsTag ?? true,
    strictMissingCredentials: rawConfig?.strictMissingCredentials ?? false,
  };

  return {
    name: 'netlify-cache-provider',
    setHeaders(options: CacheOptions): Headers {
      const headers = new Headers();
      const { netlify, cdn, browser } = buildCacheControlValues(options, config.durable ?? false);

      headers.set('Netlify-CDN-Cache-Control', netlify);
      headers.set('CDN-Cache-Control', cdn);
      headers.set('Cache-Control', browser);

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

      const uniqueTags = [...new Set(tags)];

      if (!tags.length) {
        if (config.debug) {
          console.warn('[netlify-cache-provider] Skipping invalidate without tags.');
        }

        return;
      }

      if (!config.purgeToken || !config.siteId) {
        const details = JSON.stringify(buildDiagnostics(config, uniqueTags));
        const message = `[netlify-cache-provider] Missing purgeToken and siteId. Invalidation request skipped. ${details}`;

        if (config.strictMissingCredentials) {
          throw new Error(message);
        }

        if (config.debug) {
          console.warn(message);
        }

        return;
      }

      if (config.debug) {
        const details = JSON.stringify(buildDiagnostics(config, uniqueTags));
        console.warn(`[netlify-cache-provider] Running invalidate. ${details}`);
      }

      const response = await fetch(config.apiBaseUrl!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.purgeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPurgePayload(config, uniqueTags)),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Netlify purge failed (${response.status} ${response.statusText}): ${body}`);
      }
    },
  };
};

export default netlifyCacheProviderFactory;
