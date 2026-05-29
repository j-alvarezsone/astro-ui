import type { CacheOptions } from 'astro';
import netlifyCacheProviderFactory from './netlifyCache.runtime';
import { netlifyCache } from './netlifyCache';

const purgeCacheMock = vi.hoisted(() =>
  vi.fn(async () => {
    await Promise.resolve();
  }),
);

vi.mock('@netlify/functions', () => ({
  purgeCache: purgeCacheMock,
}));

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
    purgeCacheMock.mockClear();
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
    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
    });

    await provider.invalidate({ tags: ['users'] });

    expect(purgeCacheMock).toHaveBeenCalledTimes(1);
    expect(purgeCacheMock).toHaveBeenCalledWith({
      apiURL: 'https://api.netlify.com/api/v1/purge',
      siteID: 'site-id',
      tags: ['users'],
      token: 'purge-token',
    });
  });

  it('purges without explicit credentials', async () => {
    const provider = netlifyCacheProviderFactory({
      debug: true,
    });

    await provider.invalidate({ tags: ['heroes'] });

    expect(purgeCacheMock).toHaveBeenCalledTimes(1);
    expect(purgeCacheMock).toHaveBeenCalledWith({
      apiURL: 'https://api.netlify.com/api/v1/purge',
      tags: ['heroes'],
    });
  });

  it('logs invalidate diagnostics when debug is enabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // no-op
    });

    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
      debug: true,
    });

    await provider.invalidate({ tags: ['users'] });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain('Running invalidate');
    expect(purgeCacheMock).toHaveBeenCalledTimes(1);
  });
});
