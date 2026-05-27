import netlifyCacheProviderFactory from './netlifyCache.runtime';

describe('netlify cache provider runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prefers domain-scoped purge payloads when a domain is configured', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { status: 200, statusText: 'OK' })));
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
      domain: 'deploy-preview-4--j-astro-ui.netlify.app',
    });

    await provider.invalidate({ tags: ['users'] });

    expect(fetch).toHaveBeenCalledTimes(1);

    const firstCall = fetch.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    const request = firstCall?.[1];
    expect(request).toBeDefined();

    const payload = JSON.parse(String(request?.body)) as {
      cache_tags?: string[];
      domain?: string;
      site_id?: string;
    };

    expect(payload).toEqual({
      cache_tags: ['users'],
      domain: 'deploy-preview-4--j-astro-ui.netlify.app',
    });
  });

  it('falls back to site_id when no domain scope is configured', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { status: 200, statusText: 'OK' })));
    vi.stubGlobal('fetch', fetch);

    const provider = netlifyCacheProviderFactory({
      siteId: 'site-id',
      purgeToken: 'purge-token',
    });

    await provider.invalidate({ tags: ['heroes'] });

    expect(fetch).toHaveBeenCalledTimes(1);

    const firstCall = fetch.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    const request = firstCall?.[1];
    const payload = JSON.parse(String(request?.body)) as {
      cache_tags?: string[];
      domain?: string;
      site_id?: string;
    };

    expect(payload).toEqual({
      cache_tags: ['heroes'],
      site_id: 'site-id',
    });
  });
});
