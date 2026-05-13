---
title: 'Custom Fetch Query Guide'
summary: 'How to configure, consume, and scale the custom client/server query APIs with real examples.'
order: 0
updatedAt: 2026-05-10
---

## Mental Model

This project exposes two adapters over one shared core:

- `createServerQuery()` for server execution (`createQuery`)
- `createClientQuery()` for browser state + subscriptions (`createQuery`)

Both adapters use the same query options (`queryKey`, `queryFn`, `retry`, `staleTime`, `interceptors`, and callbacks).

## Do We Need To Create Both Clients?

Usually yes, once per runtime boundary:

- Server pages/endpoints use one server client instance.
- Client islands/components use one client client instance.

You do **not** create a new client per request unless you have a strong reason.

## Global Configuration: Where And Why

Create one project-level wrapper so app code imports small helpers instead of calling constructors repeatedly.

### Suggested App Wrapper

```ts
// src/share/utils/query/appQuery.ts
import { createClientQuery, createServerQuery } from '@utils/query';

const clientQuery = createClientQuery({
  defaultRetry: 2,
  interceptors: [
    {
      onRequest: ({ queryKey, attempt }) => {
        console.debug('[client] request', queryKey, attempt);
      },
    },
  ],
});

const serverQuery = createServerQuery({
  defaultRetry: 2,
  // astroCache can be passed from runtime when available
});

export const useClientQuery = clientQuery.createQuery;
export const useServerQuery = serverQuery.createQuery;
export const invalidateQuery = clientQuery.invalidate;
export const clearClientQueryCache = clientQuery.clear;
```

This keeps naming explicit by runtime boundary and avoids repeating constructors in feature files.

If you prefer shorter aliases, you can re-export both names:

```ts
export const useQuery = useClientQuery;
```

## API Reference

### QueryOptions<TData>

```ts
interface QueryOptions<TData> {
  queryKey: string | readonly unknown[];
  queryFn: (context) => Promise<TData>;
  autoExecute?: boolean;
  staleTime?: number;
  retry?: number | ((error: unknown, attempt: number) => boolean);
  retryDelay?: number | ((attempt: number, error: unknown) => number);
  dedupe?: 'join' | 'cancel' | 'none';
  signal?: AbortSignal;
  force?: boolean;
  meta?: Record<string, unknown>;
  onSuccess?: (data: TData) => Promise<void> | void;
  onError?: (error: unknown) => Promise<void> | void;
  interceptors?: QueryInterceptor<TData>[];
}
```

### Important Options

- `queryKey`: cache identity. Prefer tuples like `['product', productId]`.
- `autoExecute`: defaults to `true`. Set to `false` for manual execution via `execute()`.
- `staleTime`: cache freshness window in milliseconds.
- `retry`: retry count or predicate.
- `dedupe`:
  - `join`: share in-flight promise for same key.
  - `cancel`: abort previous in-flight and start new one.
  - `none`: run independently.
- `meta`: custom context bag passed into `queryFn`.
- `interceptors`: lifecycle hooks (`onRequest`, `onRequestError`, `onResponse`, `onResponseError`) at attempt level.
- `onSuccess` / `onError`: final query-level callbacks.

### Error Typing Note

- Query errors are thrown at runtime as unknown values and then forwarded through the query error channel.
- When your `onError` callback expects a specific shape, narrow it before reading properties.

```ts
onError: (error) => {
  if (error instanceof Error) {
    console.error(error.message);
    return;
  }

  console.error('Unknown query error', error);
};
```

## Dedupe Modes Explained

`dedupe` controls what happens when a second request for the same `queryKey` starts while the first one is still in-flight.

```ts
dedupe?: 'join' | 'cancel' | 'none';
```

### `join` (default)

- If a request is already running for the same key, the new call reuses the same in-flight promise.
- Only one network request runs.
- All callers receive the same result.

Use when: most read/query flows where duplicate clicks or re-renders may trigger the same request.

### `cancel`

- If a request is already running for the same key, the previous one is aborted.
- A new request starts immediately.
- Best when the latest input should always win.

Use when: live search/filter changes where older responses are no longer relevant.

### `none`

- No deduplication behavior is applied.
- If another request is in-flight, a second independent request is started.
- This can create concurrent requests for the same key.

Use when: you explicitly want separate executions, even with the same key.

### Timeline Example

Assume two calls happen quickly with the same key `['products']`.

- `join`: call B waits for call A, both resolve from the same request.
- `cancel`: call B aborts call A, then call B performs a fresh request.
- `none`: call A and call B both run; whichever finishes updates the cache entry last.

### Recommendation

- Start with `join` for predictable and efficient behavior.
- Switch to `cancel` for "latest intent wins" UI interactions.
- Use `none` only when parallel duplicate requests are intentional.

## Server Example (Astro)

```ts
import { useServerQuery } from '@utils/query/appQuery';

const query = useServerQuery<{ id: string; name: string; price: number }>({
  queryKey: ['product', params.id],
  staleTime: 30_000,
  retry: 2,
  queryFn: async ({ signal }) => {
    const response = await fetch(`https://api.example.com/products/${params.id}`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as { id: string; name: string; price: number };
  },
  onSuccess: (data) => {
    console.info('final server success', data.id);
  },
  onError: (error) => {
    console.error('final server failure', error);
  },
});

if (query.isError) {
  // return fallback UI / 500 / typed error payload
}
```

## Automatic vs Manual Execution

Both adapters now support the same pattern:

- default `autoExecute: true`: starts execution immediately after query creation.
- `autoExecute: false`: does not run until you call `execute()`.

Manual mode example:

```ts
const query = useClientQuery({
  queryKey: ['products'],
  autoExecute: false,
  queryFn: async ({ signal }) => getProducts({ signal }),
});

// later
await query.execute();
```

## Client Example (Vue/Astro Island)

```ts
import { useClientQuery } from '@utils/query/appQuery';

const { execute, refetch, cancel, getState, subscribe } = useClientQuery<{ id: string; name: string }>({
  queryKey: ['product', 'p-42'],
  staleTime: 10_000,
  dedupe: 'join',
  meta: { source: 'product-card' },
  queryFn: async ({ signal, meta }) => {
    console.debug('meta', meta);

    const response = await fetch('/api/product/p-42', { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as { id: string; name: string };
  },
});

const unsubscribe = subscribe((state) => {
  console.log(state.status, state.isFetching, state.data, state.error);
});

await execute();
await refetch();
// cancel();

const { status, isFetching, data, error } = getState();

unsubscribe();
```

`subscribe` is optional. Use it when you need to react to transitions (status/fetching changes). If you only need the latest snapshot after an action, call `getState()`.

## Typed queryFn in Separate Files (Direct Function Pattern)

If you want to call `useServerQuery({ queryKey, queryFn: getAllUser })` directly, define request/response API interfaces first, then type `getAllUser` with `QueryFn<TData>`.

### 1) Shared API contract

```ts
// src/share/api/user-contact.ts
export interface UserContact {
  id: string;
  name: string;
  email: string;
}

export interface GetAllUserMeta {
  organizationId: string;
}

export interface GetAllUserResponse {
  items: UserContact[];
}
```

### 2) Reusable queryFn

```ts
// src/share/queries/users.ts
import type { QueryFn } from '@utils/query';
import type { GetAllUserMeta, GetAllUserResponse } from '../api/user-contact';

export const getAllUser: QueryFn<GetAllUserResponse> = async ({ signal, meta }) => {
  const { organizationId } = meta as GetAllUserMeta;

  const response = await fetch(`/api/users?organizationId=${organizationId}`, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as GetAllUserResponse;
};
```

### 3) Direct use in server query

```ts
import { useServerQuery } from '@utils/query/appQuery';
import { getAllUser } from '../share/queries/users';
import type { GetAllUserResponse } from '../share/api/user-contact';

const result = await useServerQuery<GetAllUserResponse>({
  queryKey: ['users', { organizationId: params.id }],
  meta: { organizationId: params.id },
  queryFn: getAllUser,
});
```

This matches your preferred shape: shared API interfaces + direct reusable `queryFn` function.

### Optional: keep `queryKey` simple and let `meta` carry request params

```ts
await useServerQuery<GetAllUserResponse>({
  queryKey: ['users', params.id],
  meta: { organizationId: params.id },
  queryFn: getAllUser,
});
```

## Interceptors vs Success/Error Callbacks

### Attempt-level

- `onResponse`: runs each successful attempt.
- `onResponseError`: runs each failed attempt.

### Final-level

- `onSuccess`: runs once after query settles successfully.
- `onError`: runs once if query ultimately fails after retries.

If retries are enabled, `onResponseError` may run multiple times while `onError` runs once.

## Caching Strategies: staleTime and swr

These two options control how long data stays fresh and when revalidation happens. Understanding their interaction is crucial for good caching behavior.

### Core Concepts

**`staleTime`** (milliseconds)

- How long cached data is considered "fresh."
- After `staleTime` expires, data is marked stale.
- On the next access, a fresh fetch is triggered.
- When stale, client queries block on refetch; server queries serve stale data if SWR is set.
- This is your **freshness guarantee.**

**`swr`** (milliseconds, server-only via Astro)

- Stale-While-Revalidate: grace period to serve stale data **while revalidating in the background.**
- Only works in server runtime with Astro route cache.
- Allows page to render quickly with stale data, then update as fresh data arrives.
- Ignored in client queries (has no effect).

### Scenario 1: Only `staleTime` (no `swr`)

```ts
await useServerQuery({
  queryKey: ['products'],
  staleTime: 30_000, // 30 seconds
  queryFn: async ({ signal }) => getProducts({ signal }),
});
```

**Timeline:**

- **0-30s**: Serve cached data (fresh)
- **30s+**: Cache is stale; next request blocks until fresh data arrives

**Behavior:**

- Users get data instantly for 30 seconds.
- After 30s, the site feels slow because rendering blocks on a fetch.

**Use when:** You want freshness guarantees and don't mind the occasional blocking refetch.

---

### Scenario 2: Only `swr` (no `staleTime`)

```ts
await useServerQuery({
  queryKey: ['products'],
  swr: 60_000, // 60 seconds, no staleTime
  queryFn: async ({ signal }) => getProducts({ signal }),
});
```

**Timeline:**

- **Immediately**: Data is always stale (no freshness window defined)
- **0-60s**: Serve stale data while revalidating in background
- **60s+**: Cache expired, block until fresh

**Behavior:**

- First request always revalidates (slow).
- Subsequent requests within 60s are fast but return old data.
- After 60s, slow again.

**Use when:** You want graceful fallback but don't care much about freshness guarantees. Rarely recommended alone.

---

### Scenario 3: Both `staleTime` and `swr` (Recommended for Server)

```ts
await useServerQuery({
  queryKey: ['products'],
  staleTime: 30_000, // 30 seconds fresh
  swr: 60_000, // 60 seconds SWR window
  queryFn: async ({ signal }) => getProducts({ signal }),
});
```

**Timeline:**

- **0-30s**: Serve fresh cached data (no refetch)
- **30-90s**: Data is stale, but serve it anyway while refetching in background
- **90s+**: Both windows expired, block until fresh

**Behavior:**

- **0-30s**: Fast, guaranteed fresh.
- **30-90s**: Fast (serves stale), revalidation happens quietly in background. Page may update as fresh data arrives.
- **90s+**: Slow (blocks on refetch).

**Example user experience:**

```
User loads /products at t=0
  ↓ gets fresh data instantly
  ↓ data stays cached for 30s

User loads /products again at t=45s
  ↓ gets stale data instantly (from SWR window)
  ↓ background revalidation starts
  ↓ page updates with fresh data when ready
```

**Use when:** You want the best of both worlds — speed + eventual freshness. Typical for server-rendered pages.

---

### Scenario 4: Neither `staleTime` nor `swr`

```ts
await useServerQuery({
  queryKey: ['products'],
  // no staleTime, no swr
  queryFn: async ({ signal }) => getProducts({ signal }),
});
```

**Timeline:**

- **Every request**: Revalidate (always fresh, always slow)

**Behavior:**

- No caching benefit; identical to not caching at all.
- Every render fetches from scratch.

**Use when:** You have real-time data and can't afford stale content.

---

### Decision Matrix

| Goal                                            | staleTime | swr    | Result                                               |
| ----------------------------------------------- | --------- | ------ | ---------------------------------------------------- |
| Fast responses with eventual freshness (server) | ✅ 30s    | ✅ 60s | Fast for 30s, then fast+bg revalidation for 60s more |
| Strict freshness, willing to block              | ✅ 30s    | ❌     | Fast for 30s, then blocks                            |
| Best effort, no freshness guarantee             | ❌        | ✅ 60s | Slow first, then fast but stale                      |
| Always fresh, no caching                        | ❌        | ❌     | Every request blocks                                 |

---

### Key Insights

1. **`staleTime` is always meaningful** — it's your freshness contract. Set it even in client queries.
2. **`swr` only helps server** — it tells Astro to serve stale data without blocking. Ignored client-side.
3. **Combine them** for best UX on server: users get speed + eventual freshness.
4. **`swr` > `staleTime`** — if you set `swr: 60_000` and `staleTime: 30_000`, the SWR window is 30-90s (staleTime to staleTime+swr).

---

## Astro Cache Bridge Notes

`createServerQuery({ astroCache })` enables route-cache mapping via `staleTime`, `swr`, and `tags` on server query calls.

- `staleTime` maps to `maxAge` (seconds)
- `swr` maps to stale-while-revalidate window
- `tags` maps to cache invalidation tags
- A deterministic `query:<hash(queryKey)>` tag is always added when cache directives are applied, so you do not need to repeat the query key manually.

### Do I Need To Pass `tags` If I Already Have `queryKey`?

`queryKey` and `tags` are related but not the same:

- `queryKey` identifies one exact query instance (exact cache key).
- `tags` are labels used to invalidate groups of different keys together.

So: no for single-query invalidation, yes for grouped invalidation.

- Skip `tags` when you only need a stable per-query cache identity; `queryKey` already produces `query:<hash>`.
- Add `tags` when you want to invalidate many related queries at once (for example all `products` queries).

```ts
await useServerQuery({
  queryKey: ['product', productId],
  staleTime: 30_000,
  queryFn,
  // auto tag exists: query:<hash(['product', productId])>
  // good for this exact query only
});

await useServerQuery({
  queryKey: ['product', productId],
  staleTime: 30_000,
  tags: ['products'],
  queryFn,
  // extra grouped tag: "products"
  // lets you invalidate product list + product detail keys together
});
```

Use this only in server runtime where Astro cache is available.

## Practical Conventions

- Keep `queryKey` stable and serializable.
- Put auth/session headers inside `queryFn` or request interceptors.
- Use `meta` for optional context, not core business data.
- Prefer `onSuccess` / `onError` for UI toasts and analytics events that should happen once.
- Prefer interceptors for request/response instrumentation and retry-aware side effects.
