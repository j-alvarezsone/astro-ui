import {
  createQueryCacheStore,
  createQueryStaleTimeContext,
  getOrCreateEntry,
  isEntryStale,
  resolveStaleTimeOption,
} from '@utils/query/cacheStore';

describe('query cache store', () => {
  it('creates and reuses entries by key hash', () => {
    const store = createQueryCacheStore();
    const now = Date.now();
    const first = getOrCreateEntry(store, 'query:a', now);

    first.hasData = true;
    first.data = { ok: true };
    store.set('query:a', first);

    const second = getOrCreateEntry<{ ok: boolean }>(store, 'query:a', now);

    expect(second.hasData).toBe(true);
    expect(second.data).toEqual({ ok: true });
  });

  it('treats undefined staleTime as stale (default 0) when data exists', () => {
    const store = createQueryCacheStore();
    const entry = getOrCreateEntry<number>(store, 'query:b', 0);

    entry.hasData = true;
    entry.data = 1;
    entry.updatedAt = 0;

    expect(isEntryStale(entry, undefined, 10_000)).toBe(true);
  });

  it('treats staleTime zero as immediately stale', () => {
    const store = createQueryCacheStore();
    const entry = getOrCreateEntry<number>(store, 'query:c', 0);

    entry.hasData = true;
    entry.data = 1;
    entry.updatedAt = 0;

    expect(isEntryStale(entry, 0, 1)).toBe(true);
  });

  it('treats staleTime Infinity and static as never stale when data exists', () => {
    const store = createQueryCacheStore();
    const entry = getOrCreateEntry<number>(store, 'query:d', 0);

    entry.hasData = true;
    entry.data = 1;
    entry.updatedAt = 0;

    expect(isEntryStale(entry, Number.POSITIVE_INFINITY, 1_000_000)).toBe(false);
    expect(isEntryStale(entry, 'static', 1_000_000)).toBe(false);
  });

  it('creates stale-time context values for a cache entry', () => {
    const store = createQueryCacheStore();
    const entry = getOrCreateEntry<number>(store, 'query:e', 1_000);

    entry.hasData = true;
    entry.data = 42;
    entry.updatedAt = 1_000;

    const context = createQueryStaleTimeContext(['query:e'], 'query:e', entry);

    expect(context.queryKey).toEqual(['query:e']);
    expect(context.data).toBe(42);
    expect(context.hasData).toBe(true);
    expect(context.status).toBe('idle');
  });

  it('resolves staleTime from a resolver function', () => {
    const store = createQueryCacheStore();
    const entry = getOrCreateEntry<number>(store, 'query:f', 1_000);

    entry.hasData = true;
    entry.data = 42;
    entry.updatedAt = 1_000;

    const staleTime = resolveStaleTimeOption(
      () => 5_000,
      createQueryStaleTimeContext(['query:f'], 'query:f', entry),
    );

    expect(staleTime).toBe(5_000);
  });
});
