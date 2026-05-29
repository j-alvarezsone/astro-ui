import { purgeCache } from '@netlify/functions';
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
 * Build a lightweight diagnostics object for provider debug logs.
 *
 * @param config - Netlify provider runtime configuration.
 * @param tags - Normalized cache tags for invalidation.
 * @returns A serializable diagnostics payload safe for logs.
 */
function buildDiagnostics(config: NetlifyCacheProviderRuntimeConfig, tags: string[]): Record<string, unknown> {
  return {
    apiBaseUrl: config.apiBaseUrl,
    durable: config.durable === true,
    tags,
    hasSiteId: Boolean(config.siteId),
    hasPurgeToken: Boolean(config.purgeToken),
  };
}

/**
 * Build a diagnostics object that reflects the effective runtime config.
 *
 * @param config - Netlify provider runtime configuration.
 * @returns A serializable config diagnostics payload safe for logs.
 * @example
 * const details = buildConfigDiagnostics({ durable: false, debug: true });
 */
function buildConfigDiagnostics(config: NetlifyCacheProviderRuntimeConfig): Record<string, unknown> {
  return {
    apiBaseUrl: config.apiBaseUrl,
    durable: config.durable === true,
    enabled: config.enabled !== false,
    purgeByPathAsTag: config.purgeByPathAsTag !== false,
    strictMissingCredentials: config.strictMissingCredentials === true,
    hasSiteId: Boolean(config.siteId),
    hasPurgeToken: Boolean(config.purgeToken),
  };
}

/**
 * Build options for Netlify `purgeCache` helper from provider configuration.
 *
 * @param config - Netlify provider runtime configuration.
 * @param tags - Unique cache tags to invalidate.
 * @returns Helper options payload.
 * @example
 * const options = buildPurgeCacheOptions({ siteId: 'site-id' }, ['heroes']);
 */
function buildPurgeCacheOptions(config: NetlifyCacheProviderRuntimeConfig, tags: string[]): Parameters<typeof purgeCache>[0] {
  return {
    tags,
    ...(config.apiBaseUrl ? { apiURL: config.apiBaseUrl } : {}),
    ...(config.siteId ? { siteID: config.siteId } : {}),
    ...(config.purgeToken ? { token: config.purgeToken } : {}),
  };
}

/**
 * Purge Netlify cache via direct API call when explicit credentials are available.
 *
 * @param config - Netlify provider runtime configuration.
 * @param tags - Unique cache tags to invalidate.
 * @returns Promise that resolves when purge completes.
 * @example
 * await purgeViaApi({ siteId: 'site-id', purgeToken: 'token' }, ['heroes']);
 */
async function purgeViaApi(config: NetlifyCacheProviderRuntimeConfig, tags: string[]): Promise<void> {
  if (!config.siteId || !config.purgeToken) {
    throw new Error('Missing siteId or purgeToken for direct purge API fallback.');
  }

  const response = await fetch(config.apiBaseUrl ?? BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.purgeToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cache_tags: tags,
      site_id: config.siteId,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Netlify purge failed (${response.status} ${response.statusText}): ${body}`);
  }
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
    durable: rawConfig?.durable,
    debug: rawConfig?.debug ?? false,
    purgeByPathAsTag: rawConfig?.purgeByPathAsTag ?? true,
    strictMissingCredentials: rawConfig?.strictMissingCredentials ?? false,
  };

  if (config.debug) {
    const details = JSON.stringify(buildConfigDiagnostics(config));
    console.warn(`[netlify-cache-provider] Loaded config. ${details}`);
  }

  return {
    name: 'netlify-cache-provider',
    setHeaders(options: CacheOptions): Headers {
      const headers = new Headers();
      const { netlify, cdn, browser } = buildCacheControlValues(options, config.durable === true);

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

      if (config.debug) {
        const details = JSON.stringify(buildDiagnostics(config, uniqueTags));
        console.warn(`[netlify-cache-provider] Running invalidate. ${details}`);
      }

      try {
        await purgeCache(buildPurgeCacheOptions(config, uniqueTags));
      } catch (error: unknown) {
        try {
          await purgeViaApi(config, uniqueTags);
        } catch (fallbackError: unknown) {
          const details = JSON.stringify(buildDiagnostics(config, uniqueTags));
          const helperReason = error instanceof Error ? error.message : String(error);
          const fallbackReason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          const message = `[netlify-cache-provider] Purge failed. ${details}; helperReason=${helperReason}; fallbackReason=${fallbackReason}`;

          if (config.strictMissingCredentials) {
            throw new Error(message, { cause: fallbackError });
          }

          if (config.debug) {
            console.warn(message);
          }
        }
      }
    },
  };
};

export default netlifyCacheProviderFactory;
