import { createQueryCacheStore, getOrCreateEntry } from '@utils/query/cacheStore';
import { executeQuery, runQueryAttempt } from '@utils/query/queryCore';
import { hashQueryKey } from '@utils/query/key';

describe('query core execution', () => {
  it('returns cached results when the entry is fresh and force is false', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['cache-test'];
    const keyHash = hashQueryKey(queryKey);
    const entry = getOrCreateEntry(store, keyHash, 1_000);

    entry.hasData = true;
    entry.data = 'cached';
    entry.updatedAt = 1_000;
    store.set(keyHash, entry);

    const result = await executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn: async () => await Promise.resolve('new'),
        staleTime: Number.POSITIVE_INFINITY,
        client: true,
      },
      {},
    );

    expect(result.isFromCache).toBe(true);
    expect(result.data).toBe('cached');
  });

  it('joins concurrent requests with the same key when dedupe mode is join', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['dedupe-join'];
    const keyHash = hashQueryKey(queryKey);
    let calls = 0;
    let release: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const queryFn = async () => {
      calls += 1;
      await gate;
      return 'ok';
    };

    const promise1 = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        client: true,
      },
      {},
    );

    const promise2 = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        client: true,
      },
      {},
    );

    release!();

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(calls).toBe(1);
    expect(result1.data).toBe('ok');
    expect(result2.data).toBe('ok');
  });

  it('does not let a superseded canceled request overwrite newer cache data', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['dedupe-cancel-supersede'];
    const keyHash = hashQueryKey(queryKey);
    let firstRelease: () => void;
    let secondRelease: () => void;
    const firstGate = new Promise<void>((resolve) => {
      firstRelease = resolve;
    });
    const secondGate = new Promise<void>((resolve) => {
      secondRelease = resolve;
    });
    let callCount = 0;

    const queryFn = async () => {
      callCount += 1;

      if (callCount === 1) {
        await firstGate;
        return 'old-result';
      }

      await secondGate;
      return 'new-result';
    };

    const firstRun = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        dedupe: 'cancel',
        client: true,
      },
      {},
    );

    const secondRun = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        dedupe: 'cancel',
        client: true,
      },
      {},
    );

    secondRelease!();
    const secondResult = await secondRun;

    expect(secondResult.status).toBe('success');
    expect(secondResult.data).toBe('new-result');

    firstRelease!();
    const firstResult = await firstRun;

    expect(firstResult.status).toBe('success');
    expect(firstResult.data).toBe('old-result');

    const entry = store.get<string>(keyHash);
    expect(entry?.data).toBe('new-result');
    expect(entry?.status).toBe('success');
  });

  it('does not run stale onSuccess for a superseded canceled request', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['dedupe-cancel-supersede-on-success'];
    const keyHash = hashQueryKey(queryKey);
    let firstRelease: () => void;
    let secondRelease: () => void;
    const firstGate = new Promise<void>((resolve) => {
      firstRelease = resolve;
    });
    const secondGate = new Promise<void>((resolve) => {
      secondRelease = resolve;
    });
    let callCount = 0;
    const onSuccess = vi.fn();

    const queryFn = async () => {
      callCount += 1;

      if (callCount === 1) {
        await firstGate;
        return 'old-result';
      }

      await secondGate;
      return 'new-result';
    };

    const firstRun = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        dedupe: 'cancel',
        onSuccess,
        client: true,
      },
      {},
    );

    const secondRun = executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        dedupe: 'cancel',
        onSuccess,
        client: true,
      },
      {},
    );

    secondRelease!();
    await secondRun;

    firstRelease!();
    await firstRun;

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('new-result');
  });

  it('retries failed requests when retry options allow it', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['retry-test'];
    const keyHash = hashQueryKey(queryKey);
    let attempt = 0;

    const queryFn = async () => {
      attempt += 1;

      if (attempt === 1) {
        await Promise.resolve();
        throw new Error('transient');
      }

      return await Promise.resolve('success');
    };

    const result = await executeQuery(
      store,
      {
        queryKey,
        keyHash,
        queryFn,
        staleTime: 0,
        retry: 2,
        retryDelay: 0,
        client: true,
      },
      {},
    );

    expect(result.status).toBe('success');
    expect(result.data).toBe('success');
    expect(attempt).toBe(2);
  });

  it('runs a direct successful attempt via runQueryAttempt', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['attempt-success'];
    const keyHash = hashQueryKey(queryKey);
    const entry = getOrCreateEntry<string>(store, keyHash, 1_000);
    entry.executionId = 1;

    const options = {
      queryKey,
      keyHash,
      queryFn: async () => await Promise.resolve('ok'),
      staleTime: 0,
      client: true,
    } as const;

    const context = {
      queryKey,
      keyHash,
      options,
      attempt: 1,
      client: true,
    };

    const result = await runQueryAttempt({
      attempt: 1,
      executionId: 1,
      entry,
      options,
      mergedInterceptors: [],
      context,
      controller: new AbortController(),
      now: () => 2_000,
      retryCount: 0,
    });

    expect(result.status).toBe('success');
    expect(result.data).toBe('ok');
    expect(entry.status).toBe('success');
    expect(entry.updatedAt).toBe(2_000);
  });

  it('retries a direct attempt and then succeeds via runQueryAttempt', async () => {
    const store = createQueryCacheStore();
    const queryKey = ['attempt-retry'];
    const keyHash = hashQueryKey(queryKey);
    const entry = getOrCreateEntry<string>(store, keyHash, 1_000);
    entry.executionId = 1;
    let attempts = 0;

    const options = {
      queryKey,
      keyHash,
      queryFn: async () => {
        attempts += 1;

        if (attempts === 1) {
          await Promise.resolve();
          throw new Error('retry');
        }

        return await Promise.resolve('ok');
      },
      staleTime: 0,
      retry: 1,
      retryDelay: 0,
      client: true,
    } as const;

    const context = {
      queryKey,
      keyHash,
      options,
      attempt: 1,
      client: true,
    };

    const result = await runQueryAttempt({
      attempt: 1,
      executionId: 1,
      entry,
      options,
      mergedInterceptors: [],
      context,
      controller: new AbortController(),
      now: () => 3_000,
      retryCount: 1,
    });

    expect(result.status).toBe('success');
    expect(result.data).toBe('ok');
    expect(attempts).toBe(2);
  });

  it('garbage collects inactive client cache entries after the default gcTime', async () => {
    vi.useFakeTimers();

    try {
      const store = createQueryCacheStore();
      const queryKey = ['gc-default-client'];
      const keyHash = hashQueryKey(queryKey);

      await executeQuery(
        store,
        {
          queryKey,
          keyHash,
          queryFn: async () => await Promise.resolve('ok'),
          staleTime: Number.POSITIVE_INFINITY,
          client: true,
        },
        {},
      );

      expect(store.has(keyHash)).toBe(true);

      vi.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(store.has(keyHash)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.has(keyHash)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not garbage collect server entries by default (SSR Infinity)', async () => {
    vi.useFakeTimers();

    try {
      const store = createQueryCacheStore();
      const queryKey = ['gc-default-server'];
      const keyHash = hashQueryKey(queryKey);

      await executeQuery(
        store,
        {
          queryKey,
          keyHash,
          queryFn: async () => await Promise.resolve('ok'),
          staleTime: Number.POSITIVE_INFINITY,
          client: false,
        },
        {},
      );

      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(store.has(keyHash)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the longest gcTime when the same cache key is executed with different values', async () => {
    vi.useFakeTimers();

    try {
      const store = createQueryCacheStore();
      const queryKey = ['gc-longest-wins'];
      const keyHash = hashQueryKey(queryKey);

      await executeQuery(
        store,
        {
          queryKey,
          keyHash,
          queryFn: async () => await Promise.resolve('ok'),
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: 1_000,
          client: true,
        },
        {},
      );

      vi.advanceTimersByTime(500);

      await executeQuery(
        store,
        {
          queryKey,
          keyHash,
          queryFn: async () => await Promise.resolve('ok'),
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: 5_000,
          client: true,
        },
        {},
      );

      vi.advanceTimersByTime(4_999);
      expect(store.has(keyHash)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.has(keyHash)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('disables garbage collection when gcTime is Infinity', async () => {
    vi.useFakeTimers();

    try {
      const store = createQueryCacheStore();
      const queryKey = ['gc-infinity'];
      const keyHash = hashQueryKey(queryKey);

      await executeQuery(
        store,
        {
          queryKey,
          keyHash,
          queryFn: async () => await Promise.resolve('ok'),
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: Number.POSITIVE_INFINITY,
          client: true,
        },
        {},
      );

      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(store.has(keyHash)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
