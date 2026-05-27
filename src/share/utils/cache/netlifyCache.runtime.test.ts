import netlifyCacheProviderFactory from './netlifyCache.runtime';

describe('netlify cache provider runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
