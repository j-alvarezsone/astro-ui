---
name: custom-fetch-query
description: Build a custom TypeScript query/fetch layer inspired by TanStack Query and ofetch without third-party runtime libraries. Use when implementing queryKey/queryFn APIs, optional staleTime caching, retry and cancellation, request/response interceptors, and separate client/server query adapters with Astro route-cache integration.
license: Apache-2.0
---

# Custom Fetch Query

Build a DRY, composable query/fetch architecture that works on client and server while keeping Astro route caching in the server layer.

## When to Use This Skill

- You need a custom queryKey/queryFn API without TanStack Query.
- You need optional staleTime semantics and cache reuse.
- You need ofetch-like interceptors (`onRequest`, `onRequestError`, `onResponse`, `onResponseError`).
- You need retry, dedupe, and abort orchestration.
- You need client and server APIs with shared core behavior.
- You need Astro route-cache mapping from query options.

## Prerequisites

- Project uses TypeScript strict mode.
- Vitest is available for unit testing.
- Astro route cache functionality requires both the SSR adapter and the experimental cache provider to be configured.

## Workflow

**Phase 1: Core Query Engine**
1. Read the architecture guide in [references/architecture.md](./references/architecture.md).
2. Implement shared core modules: key hashing, store, lifecycle, and retry logic.

**Phase 2: Client & Server Adapters**
3. Build separate client/server adapters over the shared core.
4. Validate status semantics using [references/lifecycle.md](./references/lifecycle.md).

**Phase 3: Advanced Features**
5. Add ofetch-like interceptors (`onRequest`, `onRequestError`, `onResponse`, `onResponseError`).
6. Integrate Astro route cache bridge in server adapter paths.
7. Execute the test matrix in [references/testing.md](./references/testing.md).

## References

- [Architecture](./references/architecture.md)
- [Lifecycle and Status Semantics](./references/lifecycle.md)
- [Testing Checklist](./references/testing.md)
