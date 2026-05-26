import { applyAstroRouteCache, mergeTags, toMaxAgeSeconds, toSwrSeconds } from '@utils/query/astroCache';
import type { AstroRouteCacheSetOptions } from '@utils/query/types';

describe('query astro cache bridge', () => {
  it('does not apply route cache when Astro cache is disabled', () => {
    const set = vi.fn((options: AstroRouteCacheSetOptions | false): void => {
      void options;
    });
    const cache = { enabled: false, set } as const;

    expect(applyAstroRouteCache({ cache, queryKey: ['test-key'] })).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it('does not apply route cache when no directives are present', () => {
    const set = vi.fn((options: AstroRouteCacheSetOptions | false): void => {
      void options;
    });
    const cache = { enabled: true, set } as const;

    expect(applyAstroRouteCache({ cache, queryKey: ['test-key'] })).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it('applies route cache directives when maxAge, swr, or tags are present', () => {
    const set = vi.fn((options: AstroRouteCacheSetOptions | false): void => {
      void options;
    });
    const cache = { enabled: true, set } as const;

    expect(
      applyAstroRouteCache({
        cache,
        queryKey: ['test-key'],
        maxAge: 3_000,
        swr: 2_000,
        tags: ['page'],
      }),
    ).toBe(true);

    expect(set).toHaveBeenCalledTimes(1);

    const firstCall = set.mock.calls[0] as [AstroRouteCacheSetOptions | false] | undefined;

    expect(firstCall).toBeDefined();

    const cacheOptions = firstCall?.[0];

    expect(cacheOptions).not.toBe(false);

    if (cacheOptions) {
      expect(cacheOptions.maxAge).toBe(3);
      expect(cacheOptions.swr).toBe(2);
      expect(cacheOptions.tags).toContain('page');
      expect(cacheOptions.tags?.some((tag) => tag.startsWith('query:'))).toBe(true);
    }
  });

  it('converts maxAge values to max-age seconds correctly', () => {
    expect(toMaxAgeSeconds(undefined)).toBeUndefined();
    expect(toMaxAgeSeconds('static')).toBeUndefined();
    expect(toMaxAgeSeconds(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(toMaxAgeSeconds(2_500)).toBe(2);
    expect(toMaxAgeSeconds(0)).toBe(0);
  });

  it('converts swr values to seconds correctly', () => {
    expect(toSwrSeconds(2_500)).toBe(2);
    expect(toSwrSeconds(0)).toBe(0);
    expect(toSwrSeconds(-100)).toBe(0);
  });

  it('merges explicit tags with the query-derived tag and removes duplicates', () => {
    const tags = mergeTags(['page', 'page', ''], ['test', { a: 1 }]);

    expect(tags).toContain('page');
    expect(tags.some((tag) => tag.startsWith('query:'))).toBe(true);
    expect(tags).toHaveLength(2);
  });
});
