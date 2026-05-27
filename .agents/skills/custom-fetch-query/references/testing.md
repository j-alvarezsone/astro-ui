# Testing Checklist

## Core

- Key hashing is stable across object key order.
- staleTime behavior:
  - undefined staleTime is immediately stale
  - staleTime expiry marks entry stale
  - staleTime zero is immediately stale
- Dedupe behavior:
  - join shares same in-flight promise
  - cancel aborts previous request

## Interceptors and Callbacks

- Interceptor order follows lifecycle contract.
- `onSuccess` receives typed data.
- `onError` receives unknown error.
- Failure hooks run for retry attempts and terminal failure.

## Retry and Abort

- Default retry runs exactly expected attempts.
- Abort stops retries and yields terminal error state.
- Retry predicate override works.

## Client Adapter

- First run sets `isPending` and `isFetching`.
- Background refetch sets `isFetching` without forcing `isPending`.
- Success and error flags transition correctly.

## Server Adapter

- Returns settled data/error without loading flags.
- Astro cache bridge is invoked only when cache context exists.
- staleTime omission does not force route cache maxAge.
