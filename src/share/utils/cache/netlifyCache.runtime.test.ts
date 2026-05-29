import type { CacheOptions } from 'astro';
import netlifyCacheProviderFactory from './netlifyCache.runtime';
import { netlifyCache } from './netlifyCache';

/**
 * Invoke the provider `setHeaders` method without returning an unbound method reference.
 *
 * @param provider - Netlify cache provider returned from the runtime factory.
 * @param options - Cache options forwarded to the provider.
 * @returns The generated response headers.
 * @example
 * const headers = callSetHeaders(netlifyCacheProviderFactory({}), { maxAge: 60, swr: 120, tags: ['heroes'] });
 */
function callSetHeaders(
  provider: ReturnType<typeof netlifyCacheProviderFactory>,
  options: CacheOptions,
): Headers {
  if (!provider.setHeaders) {
    throw new TypeError('Expected provider.setHeaders to be defined.');
  }

  return provider.setHeaders(options);
}

function requireConfig(config: ReturnType<typeof netlifyCache>['config']): NonNullable<typeof config> {
  if (!config) {
    throw new TypeError('Expected provider config to be defined.');
  }

  return config;
}

describe('netlify cache provider runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not include the durable directive unless explicitly enabled', () => {
    const provider = netlifyCacheProviderFactory({});
    const headers = callSetHeaders(provider, { maxAge: 60, swr: 120, tags: ['heroes'] });

    expect(headers.get('Netlify-CDN-Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=120');
    expect(headers.get('CDN-Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=120');
  });

  it('includes the durable directive only when astro config provides it', () => {
    const providerConfig = requireConfig(netlifyCache({ durable: true }).config);
    const provider = netlifyCacheProviderFactory(providerConfig);
    const headers = callSetHeaders(provider, { maxAge: 60, swr: 120, tags: ['heroes'] });

    expect(providerConfig.durable).toBe(true);
    expect(headers.get('Netlify-CDN-Cache-Control')).toBe('public, durable, s-maxage=60, stale-while-revalidate=120');
    expect(headers.get('CDN-Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=120');
  });

  it('keeps durable undefined when astro config does not provide it', () => {
    const providerConfig = requireConfig(netlifyCache({}).config);

    expect(providerConfig.durable).toBeUndefined();
  });

  it('uses site_id when provided', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      await Promise.resolve(new Response('', { status: 200, statusText: 'OK' }))
    );
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
    });

    await provider.invalidate({ tags: ['users'] });

    expect(fetch).toHaveBeenCalledTimes(1);

    const request = fetch.mock.calls[0]?.[1];
    expect(request).toBeDefined();
    expect(typeof request?.body).toBe('string');

    if (typeof request?.body !== 'string') {
      throw new TypeError('Expected request body to be a JSON string.');
    }

    const payload: unknown = JSON.parse(request.body);

    expect(payload).toEqual({
      cache_tags: ['users'],
      site_id: 'site-id',
    });
  });

  it('skips invalidation without a site_id', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      await Promise.resolve(new Response('', { status: 200, statusText: 'OK' }))
    );
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      purgeToken: 'purge-token',
    });

    await provider.invalidate({ tags: ['heroes'] });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when strictMissingCredentials is enabled and credentials are missing', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      await Promise.resolve(new Response('', { status: 200, statusText: 'OK' }))
    );
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      strictMissingCredentials: true,
    });

    await expect(provider.invalidate({ tags: ['heroes'] })).rejects.toThrow(/Missing purgeToken and siteId/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('logs invalidate diagnostics when debug is enabled', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      await Promise.resolve(new Response('', { status: 200, statusText: 'OK' }))
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // no-op
    });
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
      debug: true,
    });

    await provider.invalidate({ tags: ['users'] });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain('Running invalidate');
  });
});
