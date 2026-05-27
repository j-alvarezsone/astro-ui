---
title: 'Query API Reference'
summary: 'Complete API reference for useClientQuery, useServerQuery, useMutationQuery, and queryOptions with every option explained.'
order: 0
updatedAt: 2026-05-27
---

## Query System API

This project exposes four primary APIs for feature code:

- `useClientQuery(options)`
- `useServerQuery(options)`
- `useMutationQuery(options)`
- `queryOptions(options)`
- `invalidateServerQuery(options)`

All of them are built around a shared query options contract and a shared execution core.

## Shared Types

### `QueryKey`

```ts
type QueryKey = readonly unknown[];
```

Use stable keys such as `['users']` or `['user', userId]`.

### `QueryFnContext<TPayload>`

```ts
interface QueryFnContext<TPayload = unknown> {
  queryKey: QueryKey;
  signal: AbortSignal;
  attempt: number;
  client: boolean;
  payload?: TPayload;
  meta?: Record<string, unknown>;
}
```

Every `queryFn` receives this context.

### `QueryStateStatus`

```ts
type QueryStateStatus = 'idle' | 'pending' | 'success' | 'error';
```

### `QueryOptions<TData, TError, TPayload>`

```ts
interface QueryOptions<TData, TError = unknown, TPayload = unknown> {
  queryKey: QueryKey;
  queryFn: (context: QueryFnContext<TPayload>) => Promise<TData>;
  autoExecute?: boolean;
  staleTime?: number | 'static' | ((query) => number | 'static');
  gcTime?: number;
  retry?: number | ((error: unknown, attempt: number) => boolean);
  retryDelay?: number | ((attempt: number, error: unknown) => number);
  dedupe?: 'join' | 'cancel' | 'none';
  force?: boolean;
  meta?: Record<string, unknown>;
  onSuccess?: (data: TData) => Promise<void> | void;
  onError?: (error: TError) => Promise<void> | void;
  interceptors?: QueryInterceptor<TData, TError, TPayload>[];
}
```

## `useClientQuery`

Create a client-side query controller backed by the shared browser cache.

### Signature

```ts
function useClientQuery<TData, TError = unknown, TPayload = unknown>(
  options: QueryOptions<TData, TError, TPayload>,
): ClientQueryController<TData, TError, TPayload>;
```

### Parameter 1: `options`

- `queryKey` (required): unique cache identity.
- `queryFn` (required): async function that returns data.
- `autoExecute` (default `true`): runs immediately after controller creation.
- `staleTime` (default stale): fresh window. Accepts number in ms, `'static'`, or resolver function.
- `gcTime` (default `300000` in client): cache entry retention in ms.
- `retry` (default from app client config): number of retries or predicate.
- `retryDelay` (optional): ms or function to compute delay between retries.
- `dedupe` (default `'join'`): behavior for concurrent same-key requests.
- `force` (optional): force network execution (normally set via `execute({ force: true })`).
- `meta` (optional): arbitrary metadata available in `queryFn` context.
- `onSuccess` (optional): called once when query settles successfully.
- `onError` (optional): called once when query settles as failure.
- `interceptors` (optional): lifecycle hooks per attempt (`onRequest`, `onRequestError`, `onResponse`, `onResponseError`).

### Returns: `ClientQueryController`

```ts
interface ClientQueryController<TData, TError, TPayload> {
  subscribe(listener): () => void;
  execute(options?: { force?: boolean; payload?: TPayload }): Promise<ClientQueryState<TData, TError>>;
  refetch(): Promise<ClientQueryState<TData, TError>>;
  cancel(): void;

  readonly status: 'idle' | 'pending' | 'success' | 'error';
  readonly data?: TData;
  readonly error: TError | null;
  readonly isStale: boolean;
  readonly isPending: boolean;
  readonly isFetching: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
}
```

### Client controller method semantics

- `execute()`:
  - Runs the query while respecting freshness.
  - If cached data is still fresh and `force` is not set, it can return from cache.
  - Use for normal/manual execution flow.
- `execute({ force: true })`:
  - Forces a network execution even when cached data is fresh.
- `refetch()`:
  - Equivalent to `execute({ force: true })`.
  - Use when the user explicitly requests a refresh.
- `cancel()`:
  - Aborts the current in-flight request for this controller key.
- `subscribe(listener)`:
  - Receives every state transition and returns an unsubscribe function.

### Client state fields

- `status`: `'idle' | 'pending' | 'success' | 'error'`.
- `data`: latest successful payload when available.
- `error`: latest terminal error or `null`.
- `isPending`: `true` when first load is in-flight and no successful data exists yet.
- `isFetching`: `true` whenever a request is in-flight (first load or background refresh).
- `isSuccess`: `true` after successful completion.
- `isError`: `true` after terminal failure.
- `isStale`: `true` when cached data is considered stale under `staleTime` rules.

### Execute vs Refetch (quick rule)

- Use `execute()` for normal program flow, especially with `autoExecute: false`.
- Use `refetch()` for explicit user refresh actions (refresh button, retry-now, pull-to-refresh).

### Example

```ts
import type { ClientQueryController } from '@utils/query';
import type { GetAllPetsResponse } from '../share/types/pet-contact';
import { useClientQuery } from '@utils/query';
import { getAllPetsOptions } from '../share/queries/pets';

class FetchPetsQueryElement extends HTMLElement {
  #query: ClientQueryController<GetAllPetsResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    // autoExecute defaults to true, so this starts fetching immediately.
    this.#query = useClientQuery(getAllPetsOptions);

    this.#unsubscribe = this.#query.subscribe(() => {
      this.#render();
    });

    this.#render();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#query?.cancel();
    this.#query = null;
  }

  async refresh(): Promise<void> {
    // Explicit user refresh path.
    await this.#query?.refetch();
  }

  #render(): void {
    if (!this.#query) {
      return;
    }

    const isLoading = this.#query.isPending || this.#query.isFetching;
    const hasError = this.#query.isError;
    const pets = this.#query.data?.items ?? [];

    console.log({ isLoading, hasError, pets });
  }
}

if (!customElements.get('fetch-pets-query')) {
  customElements.define('fetch-pets-query', FetchPetsQueryElement);
}
```

## `useMutationQuery`

Create a mutation controller backed by the client query runtime.

### Signature

```ts
function useMutationQuery<TData, TPayload = unknown, TError = unknown>(
  options: MutationOptions<TData, TPayload, TError>,
): MutationController<TData, TPayload, TError>;
```

`MutationOptions` is the same shape as `QueryOptions`, but this wrapper always starts in manual mode.

### Mutation behavior

- Mutations do not auto-run.
- `mutate(payload)` executes with `force: true`.
- `context.payload` in `queryFn` receives your payload.

### Parameter 1: `options`

Use the same fields as `useClientQuery` options.

- For mutations, `queryKey` should represent the action, for example `['pets', 'create']`.
- `dedupe`/`retry` still apply because execution uses the same core engine.

### Returns: `MutationController`

`MutationController` is the mutation-focused controller. In docs and usage, prefer the mutation-specific surface:

```ts
mutate(payload?: TPayload): Promise<{
  status: QueryStateStatus;
  data?: TData;
  error: TError | null;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}>;

reset(): void;
```

Mutation state intentionally excludes `isFetching` and `isStale`.
`isIdle`, `isPending`, `isSuccess`, and `isError` are derived from `status`.

### Mutation method semantics

- `mutate(payload)`:
  - Primary mutation trigger.
  - Runs the write operation using your payload.
- `reset()`:
  - Clears mutation state back to initial idle.
  - Use this after showing a success/error message when you want a clean form state.
- `subscribe(listener)`:
  - Observe pending/success/error changes to update UI state.

### Example

```ts
import { invalidateQuery } from '@utils/query';

const createPet = useMutationQuery<CreatePetResponse, CreatePetBody>({
  queryKey: ['pets', 'create'],
  queryFn: async ({ payload }) => {
    if (!payload) throw new Error('Pet payload is required');
    const response = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  onSuccess: () => {
    invalidateQuery(['pets']);
  },
});

await createPet.mutate({ name: 'Buddy', type: 'dog' });
```

### Reusable `mutationOptions` example (project pattern)

```ts
import { invalidateQuery } from '@utils/query';
import { mutationOptions } from '@utils/query/mutationOptions';
import type { CreatePetBody, CreatePetResponse } from '@/types/pet-contact';
import { postNewPet } from '@/actions/pets';

export const createPetOptions = mutationOptions<CreatePetResponse, CreatePetBody>({
  queryKey: ['pets', 'create'],
  queryFn: async (context) => {
    if (!context.payload) {
      throw new Error('Pet payload is required');
    }

    return await postNewPet(context.payload);
  },
  onSuccess: () => {
    invalidateQuery(['pets']);
  },
});
```

Then use it (same pattern as `add-pet.web.ts`):

```ts
import { useMutationQuery } from '@utils/query';
import { createPetOptions } from '@queries/pets';

const mutation = useMutationQuery(createPetOptions);

if (!mutation.isPending) {
  await mutation.mutate({ name: 'Buddy', type: 'dog' });
}
```

### Exact web-component integration (`add-pet.web.ts` pattern)

```ts
import type { MutationController } from '@utils/query';
import type { CreatePetBody, CreatePetResponse } from '@/types/pet-contact';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import { useMutationQuery } from '@utils/query';
import { createPetOptions } from '@queries/pets';

const SAMPLE_PETS: CreatePetBody[] = [
  { name: 'Buddy', type: 'dog' },
  { name: 'Whiskers', type: 'cat' },
];

let sampleIndex = 0;

class AddPetElement extends HTMLElement {
  #mutation: MutationController<CreatePetResponse, CreatePetBody> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useMutationQuery(createPetOptions);
    const mutation = this.#mutation;

    this.#unsubscribe = mutation.subscribe(() => {
      const button = this.querySelector<HTMLElement>('.button');
      if (button) {
        applyButtonLoadingState(button, mutation.isPending);
      }
    });

    this.addEventListener('click', () => {
      this.#addPet().catch(console.error);
    });
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#mutation = null;
  }

  async #addPet(): Promise<void> {
    if (!this.#mutation) return;
    if (this.#mutation.isPending) return;

    const payload = SAMPLE_PETS[sampleIndex % SAMPLE_PETS.length];
    sampleIndex += 1;

    await this.#mutation.mutate(payload);
  }
}
```

## `invalidateQuery`

Invalidate client query cache entries by key.

### Signature

```ts
function invalidateQuery(
  queryKey: QueryKey,
  options?: {
    exact?: boolean;
    refetchType?: 'none' | 'active';
  },
): boolean;
```

### Parameters

- `queryKey` (required): key (or key prefix when `exact: false`) to invalidate.
- `options.exact` (default `true`):
  - `true`: only invalidate exact key match.
  - `false`: invalidate keys that start with the provided key parts.
- `options.refetchType` (default `'active'`):
  - `'active'`: immediately refetch matching queries that currently have subscribers.
  - `'none'`: invalidate only; do not auto-refetch.

### Returns

- `true` if at least one cache entry was invalidated.
- `false` if no matching cache entries were found.

### Examples

```ts
// Exact key invalidation (default behavior).
invalidateQuery(['pets']);

// Invalidate all keys prefixed by ['pets'] and refetch active subscribers.
invalidateQuery(['pets'], { exact: false, refetchType: 'active' });

// Invalidate without auto-refetch.
invalidateQuery(['pets'], { refetchType: 'none' });
```

## `invalidateServerQuery`

Invalidate server query cache entries by key, with optional Astro route-cache invalidation.

### Signature

```ts
async function invalidateServerQuery(options: {
  queryKey?: QueryKey;
  cache?: AstroRouteCacheInvalidatorLike;
  tags?: string[];
  path?: string;
}): Promise<boolean>;
```

### Parameters

- `options.queryKey` (optional): key used to remove the server query-store entry.
- `options.cache` (optional): Astro route-cache invalidator object (for API routes, this is the `cache` value from route context).
- `options.tags` (optional): route-cache tags to invalidate when `options.cache?.enabled` is `true`.
- `options.path` (optional): route path to invalidate when `options.cache?.enabled` is `true`.

### Behavior

- Invalidates the server query store only when `options.queryKey` is provided.
- Route-cache invalidation runs only when:
  - `options.cache?.enabled === true`, and
  - at least one of `options.tags` or `options.path` is provided.

### Returns

- Resolves to `true` if a server query-store entry was invalidated.
- Resolves to `false` if no matching server query-store entry exists or no `options.queryKey` was provided.

### Examples

```ts
// Invalidate only the server query-store entry.
await invalidateServerQuery({ queryKey: ['users'] });

// Route mode: invalidate matching route-cache tags.
await invalidateServerQuery({
  cache,
  tags: ['users'],
});

// Route mode: invalidate a specific route path.
await invalidateServerQuery({
  cache,
  path: '/query-system/server-route-query',
});

// Optional: invalidate query store and route cache in one call.
await invalidateServerQuery({
  queryKey: ['users'],
  cache,
  tags: ['users'],
});
```

When this runs on Netlify preview, make sure the cache provider is configured with `NETLIFY_AUTH_TOKEN`, `siteId`, and cache tags, otherwise the edge cache can keep serving stale responses.

## `useServerQuery`

Create a server query controller and optionally auto-execute it.

### Signatures

```ts
function useServerQuery<TData, TError = unknown>(
  options: ServerQueryDefaultModeOptions<TData, TError>,
): Promise<ServerQueryController<TData, TError>>;

function useServerQuery<TData, TError = unknown>(
  options: ServerQueryQueryModeOptions<TData, TError>,
): Promise<ServerQueryController<TData, TError>>;

function useServerQuery<TData, TError = unknown>(
  options: ServerQueryRouteModeOptions<TData, TError>,
): Promise<ServerQueryController<TData, TError>>;
```

### Mode A: default/query cache mode

Use standard query cache behavior.

- `cacheMode` omitted or `'query'`
- `queryKey` required
- `staleTime` allowed

Supported options are the shared `QueryOptions` fields.

### Mode B: route cache mode

Use Astro route cache directives per execution.

Required/allowed fields:

- `cacheMode: 'route'`
- `routeCache` (required):
  - `cache`: Astro route cache object
  - `maxAge?`: number ms, `Infinity`, or `'static'`
  - `swr?`: number ms
  - `tags?`: string[]
- `queryFn` (required)
- `queryKey` not allowed
- `staleTime` not allowed

### Auto execution behavior

`useServerQuery` creates the controller in manual mode internally, then:

- if `options.autoExecute !== false`, it awaits `query.execute()` before returning.
- if `options.autoExecute === false`, it returns without executing.

### Returns: `ServerQueryController`

```ts
interface ServerQueryController<TData, TError> {
  execute(options?: { force?: boolean }): Promise<ServerQueryResult<TData, TError>>;
  refetch(): Promise<ServerQueryResult<TData, TError>>;

  readonly data?: TData;
  readonly error: TError | null;
  readonly isStale: boolean;
  readonly keyHash: string;
  readonly isFromCache: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
}
```

### Server controller method semantics

- `execute()`:
  - Runs the query once, respecting stale/cache behavior in query mode.
  - In route mode, runs using route-cache directives.
- `execute({ force: true })`:
  - Forces a fresh execution.
- `refetch()`:
  - Equivalent to `execute({ force: true })`.

### Server result fields

- `data`: latest successful payload.
- `error`: terminal error or `null`.
- `isSuccess`: `true` when last execution succeeded.
- `isError`: `true` when last execution failed.
- `isFromCache`: `true` when served from query cache.
- `isStale`: stale state for cached query mode.
- `keyHash`: stable hash for the execution key.

### Query mode example

```ts
const {
  data: users,
  isFromCache,
  isError,
  error,
} = await useServerQuery<User[]>({
  queryKey: ['users'],
  staleTime: 60_000,
  queryFn: async ({ signal }) => {
    const response = await fetch('https://example.com/api/users', { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
});

if (isError) {
  throw error;
}

console.log(isFromCache);
```

### Route mode example

```ts
const { data: users } = await useServerQuery<User[]>({
  cacheMode: 'route',
  routeCache: {
    cache,
    maxAge: 30_000,
    swr: 60_000,
    tags: ['users'],
  },
  queryFn: async ({ signal }) => {
    const response = await fetch('https://example.com/api/users', { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
});
```

`isFromCache` is a query-store cache hit signal and is meaningful in query mode.
In route mode, execution is uncached at the query layer and cache behavior is
controlled by Astro route cache (`routeCache`).

### Route cache diagnostics on Netlify

When validating route mode on Netlify, treat Astro cache and Netlify CDN cache as separate layers:

- `x-astro-cache: HIT|MISS` reflects Astro route cache behavior for the request.
- `cache-status: "Netlify Edge" ...` and `cache-status: "Netlify Durable" ...` reflect CDN/storage cache behavior.

You can see `x-astro-cache: HIT` while Netlify still reports edge miss or durable bypass. That is expected when the route response is not CDN-cacheable (for example with `cache-control: no-cache`) but Astro route cache is active in the runtime.

Quick check pattern:

1. Make two immediate requests to the same route-mode endpoint.
2. First response commonly shows `x-astro-cache: MISS`.
3. Second response should show `x-astro-cache: HIT` when Astro route cache is active.

### Reading HIT stale vs MISS

When your environment exposes cache state labels, interpret them as follows:

- `HIT` (fresh): served from route cache inside `maxAge`.
- `HIT` (stale): served from route cache inside `swr` while revalidation runs in the background.
- `MISS`: no usable route-cache entry for this execution (first request, expired entry, cold runtime instance, or runtime restart).

With `maxAge: 10_000` and `swr: 50_000`, the expected timeline on a single warm runtime is:

1. `0-10s`: usually `HIT` (fresh).
2. `10-60s`: usually `HIT` (stale).
3. `>60s`: more likely `MISS`.

On Netlify preview, requests can still alternate between `HIT` and `MISS` inside the same window because different requests may land on different serverless instances with different in-memory cache state.

## `queryOptions`

Create reusable, strongly-typed query option objects.

### Signature

```ts
const queryOptions = <
  TData,
  TError = unknown,
  TOptions extends QueryOptions<TData, TError> = QueryOptions<TData, TError>,
>(
  options: TOptions,
): TOptions => options;
```

### Parameter 1: `options`

- Same shape as `QueryOptions`.
- Returned as-is with preserved generic inference.
- `TData` is inferred from `queryFn` return type in normal usage.
- Explicit generics like `queryOptions<GetAllPetsResponse>(...)` are optional and usually only needed when inference cannot resolve an inline/union function shape.

### Important scope note

`queryOptions()` is for `QueryOptions` shape (query key based mode). For `useServerQuery` route mode (`cacheMode: 'route'`), pass the object directly to `useServerQuery` instead of wrapping it in `queryOptions()`.

### Example

```ts
export const getAllPetsOptions = queryOptions({
  queryKey: ['pets'],
  staleTime: 3_000,
  queryFn: getAllPets,
});

const petsOnServer = await useServerQuery(getAllPetsOptions);
const petsOnClient = useClientQuery(getAllPetsOptions);
```

## Option Details Reference

This section applies to `useClientQuery`, `useMutationQuery`, and query-mode `useServerQuery`.

- `queryKey`: cache identity. Array keys are recommended for composite identity.
- `queryFn`: execution function. Must return a promise.
- `autoExecute`: immediately execute after controller creation. Default `true` (except mutation wrapper semantics).
- `staleTime`:
  - number: fresh duration in ms
  - `'static'`: never stale
  - resolver function: computed per entry using current state context
  - numeric separators are only visual formatting: `30_000 === 30000` (30s), while `3_000 === 3000` (3s)
- `gcTime`: cache retention ms. Client default is `300000`; server default is `Infinity`.
- `retry`:
  - number: max retry count
  - function: custom retry decision per attempt/error
- `retryDelay`:
  - number: fixed delay in ms
  - function: dynamic delay by attempt/error
- `dedupe`:
  - `'join'`: reuse the active in-flight promise
  - `'cancel'`: abort active request and start a new one
  - `'none'`: run requests independently
- `force`: bypass stale cache checks and execute fresh.
- `meta`: custom values available in `queryFn` context.
- `onSuccess`: runs after final success.
- `onError`: runs after final failure.
- `interceptors`: attempt-level lifecycle hooks.

## Dedupe Behavior (`join`, `cancel`, `none`)

`dedupe` only matters when a second request for the same `queryKey` starts while the first one is still in-flight.

If there is no in-flight request, all modes behave the same.

### `join` (default)

- The second call reuses the first call's in-flight promise.
- Only one network request runs.
- Both callers resolve/reject with the same final result.

Use when you want to avoid duplicate traffic for the same data.

### `cancel`

- The second call aborts the previous in-flight request.
- A new request starts immediately.
- The latest caller controls the final result for that key.

Use when newest user intent should win (for example fast-changing filters/search).

### `none`

- No deduplication is applied.
- Multiple same-key requests run concurrently.
- The cache ends with whichever request finishes last.

Use only when parallel same-key requests are intentional.

### Timeline Example

Assume two executions happen close together for the same key `['users']`:

- `join`: request B waits for request A, both share one fetch.
- `cancel`: request B aborts request A, then B performs a new fetch.
- `none`: request A and B both fetch in parallel; last completion wins cache state.

### Practical Recommendation

- Start with `join` unless you have a strong reason not to.
- Use `cancel` for latest-input-wins UX.
- Avoid `none` for regular reads because it can introduce racey cache outcomes.

## Interceptor Lifecycle

If interceptors are configured, the execution order is:

1. `onRequest`
2. `queryFn`
3. `onResponse` on success, or `onResponseError` on failure
4. Retry if configured
5. `onSuccess` (final success) or `onError` (terminal failure)

## Usage Patterns

### Reusable options colocated with query functions

```ts
export const getAllUsersOptions = queryOptions({
  queryKey: ['users'],
  queryFn: getAllUsers,
  staleTime: 10_000,
});
```

### Manual execution pattern

```ts
const query = useClientQuery({
  queryKey: ['users'],
  autoExecute: false,
  queryFn: getAllUsers,
});

await query.execute();
```

### Force refresh pattern

```ts
await query.execute({ force: true });
// equivalent intent
await query.refetch();
```
