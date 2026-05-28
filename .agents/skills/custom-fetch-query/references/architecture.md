# Architecture

## Goals

- Shared query core for client and server.
- Optional staleTime (no default).
- Interceptors and callbacks inspired by ofetch.
- Retry and abort behavior inspired by query libraries.
- Server bridge to Astro route cache.

## Module Boundaries

- `types.ts`: contracts, option types, status/result models.
- `key.ts`: stable query key hashing.
- `cacheStore.ts`: in-memory cache entry store and freshness checks.
- `interceptors.ts`: lifecycle hook execution helpers.
- `retry.ts`: retry decision and delay strategy.
- `queryCore.ts`: request lifecycle orchestration.
- `clientQuery.ts`: client-facing stateful API (`isPending`, `isFetching`, etc.).
- `serverQuery.ts`: server-facing API with data/error result only.
- `astroCache.ts`: map staleTime/swr/tags into Astro route cache options.

## DRY Rules

- Keep retry logic only in `retry.ts`.
- Keep stale checks only in `cacheStore.ts`.
- Keep interceptor execution only in `interceptors.ts`.
- Keep key serialization only in `key.ts`.
- Adapters must call `queryCore.ts` and avoid duplicating lifecycle logic.

## Cache Semantics

- `staleTime` is optional at the API boundary.
- For cache freshness checks, an omitted or `undefined` `staleTime` is resolved to `0`.
- This means cached data is immediately stale unless a positive `staleTime` is provided.
- `staleTime: 0` means immediately stale.
- Dedupe policy:
  - `join`: share one in-flight promise for same key.
  - `cancel`: abort previous request, start a new one.
  - `none`: allow parallel requests.

## Astro Cache Integration

- Server-only behavior.
- Apply route cache directives only when Astro cache context is provided.
- Map `staleTime(ms)` -> `maxAge(seconds)`.
- Keep mapping optional: no staleTime means no forced cache maxAge.
- Support optional `swr` and `tags`.
