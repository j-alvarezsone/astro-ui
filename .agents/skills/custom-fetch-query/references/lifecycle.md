# Lifecycle and Status Semantics

## Interceptor Order

1. `onRequest`
2. query execution attempt
3. on failure:
   - `onRequestError` for transport-like failures
   - `onResponseError` for HTTP-like failures (status metadata present)
4. on success: `onResponse`
5. final callbacks:
   - `onSuccess(data)` when successful
   - `onError(error)` when final failure after retries

## Retry Behavior

- Default retry count: `3`.
- Retry condition defaults to network and 5xx-like failures.
- Retry delay supports fixed number or function.
- Do not retry abort errors.

## Client Status Model

- `isPending`: first run is in-flight with no successful data yet.
- `isFetching`: any in-flight request, including background refetch.
- `isSuccess`: last settled state is success.
- `isError`: last settled state is error.
- Optional alias: `isLoading` mirrors `isPending`.

## Server Status Model

- Server adapter returns settled result (`data` or `error`) and booleans `isSuccess` / `isError`.
- Do not expose client loading flags in server API signatures.
