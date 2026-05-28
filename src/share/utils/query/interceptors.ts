import type { QueryInterceptor, QueryLifecycleContext, QueryOptions } from '@utils/query/types';

/**
 * Convert typed query options into an unknown-safe shape for global interceptors.
 *
 * @param options - Typed query options from the current query lifecycle.
 * @returns Query options cast to an unknown data shape.
 * @example
 * ```ts
 * const normalized = toUnknownQueryOptions(options);
 * ```
 */
function toUnknownQueryOptions<TData, TError>(
  options: Omit<QueryOptions<TData, TError>, 'queryFn'>,
): Omit<QueryOptions<unknown>, 'queryFn'> {
  const staleTime = typeof options.staleTime === 'function' ? undefined : options.staleTime;

  return {
    queryKey: options.queryKey,
    staleTime,
    retry: options.retry,
    retryDelay: options.retryDelay,
    dedupe: options.dedupe,
    force: options.force,
    meta: options.meta,
  };
}

/**
 * Convert a typed lifecycle context into an unknown-safe lifecycle context.
 *
 * @param context - Typed lifecycle context.
 * @returns Lifecycle context with unknown data typing.
 * @example
 * ```ts
 * const unknownContext = toUnknownLifecycleContext(context);
 * ```
 */
function toUnknownLifecycleContext<TData, TError>(
  context: QueryLifecycleContext<TData, TError>,
): QueryLifecycleContext<unknown> {
  return {
    queryKey: context.queryKey,
    keyHash: context.keyHash,
    options: toUnknownQueryOptions(context.options),
    attempt: context.attempt,
    client: context.client,
  };
}

/**
 * Adapt a global interceptor so it can run against typed query contexts.
 *
 * @param interceptor - Global interceptor using unknown data typing.
 * @returns A typed interceptor wrapper.
 * @example
 * ```ts
 * const typedInterceptor = adaptGlobalInterceptor(globalInterceptor);
 * ```
 */
function adaptGlobalInterceptor<TData, TError>(
  interceptor: QueryInterceptor<unknown>,
): QueryInterceptor<TData, TError> {
  return {
    onRequest: interceptor.onRequest
      ? async (context): Promise<void> => {
          await interceptor.onRequest?.(toUnknownLifecycleContext(context));
        }
      : undefined,
    onRequestError: interceptor.onRequestError
      ? async (context, error): Promise<void> => {
          await interceptor.onRequestError?.(toUnknownLifecycleContext(context), error);
        }
      : undefined,
    onResponse: interceptor.onResponse
      ? async (context, data): Promise<void> => {
          await interceptor.onResponse?.(toUnknownLifecycleContext(context), data);
        }
      : undefined,
    onResponseError: interceptor.onResponseError
      ? async (context, error): Promise<void> => {
          await interceptor.onResponseError?.(toUnknownLifecycleContext(context), error);
        }
      : undefined,
  };
}

/**
 * Combine global and local query interceptors into a single ordered list.
 *
 * @param globalInterceptors - Global interceptors applied to all queries.
 * @param localInterceptors - Interceptors specific to a single query.
 * @returns The combined interceptor list.
 */
export function mergeInterceptors<TData, TError>(
  globalInterceptors: QueryInterceptor<unknown>[] | undefined,
  localInterceptors: QueryInterceptor<TData, TError>[] | undefined,
): QueryInterceptor<TData, TError>[] {
  return [
    ...(globalInterceptors?.map((interceptor) => adaptGlobalInterceptor<TData, TError>(interceptor)) ?? []),
    ...(localInterceptors ?? []),
  ];
}

/**
 * Run all onRequest interceptor hooks in sequence.
 *
 * @param interceptors - Interceptors to execute.
 * @param context - The current query lifecycle context.
 * @returns A promise that resolves when all interceptors complete.
 */
export async function runOnRequestInterceptors<TData, TError>(
  interceptors: QueryInterceptor<TData, TError>[],
  context: QueryLifecycleContext<TData, TError>,
): Promise<void> {
  await runSequential(interceptors, async (interceptor): Promise<void> => {
    await interceptor.onRequest?.(context);
  });
}

/**
 * Run all onRequestError interceptor hooks in sequence.
 *
 * @param interceptors - Interceptors to execute.
 * @param context - The current query lifecycle context.
 * @param error - The error thrown during the request phase.
 * @returns A promise that resolves when all interceptors complete.
 */
export async function runOnRequestErrorInterceptors<TData, TError>(
  interceptors: QueryInterceptor<TData, TError>[],
  context: QueryLifecycleContext<TData, TError>,
  error: TError,
): Promise<void> {
  await runSequential(interceptors, async (interceptor): Promise<void> => {
    await interceptor.onRequestError?.(context, error);
  });
}

/**
 * Run all onResponse interceptor hooks in sequence.
 *
 * @param interceptors - Interceptors to execute.
 * @param context - The current query lifecycle context.
 * @param data - The response data from a successful query attempt.
 * @returns A promise that resolves when all interceptors complete.
 */
export async function runOnResponseInterceptors<TData, TError>(
  interceptors: QueryInterceptor<TData, TError>[],
  context: QueryLifecycleContext<TData, TError>,
  data: TData,
): Promise<void> {
  await runSequential(interceptors, async (interceptor): Promise<void> => {
    await interceptor.onResponse?.(context, data);
  });
}

/**
 * Run all onResponseError interceptor hooks in sequence.
 *
 * @param interceptors - Interceptors to execute.
 * @param context - The current query lifecycle context.
 * @param error - The error thrown during the response phase.
 * @returns A promise that resolves when all interceptors complete.
 */
export async function runOnResponseErrorInterceptors<TData, TError>(
  interceptors: QueryInterceptor<TData, TError>[],
  context: QueryLifecycleContext<TData, TError>,
  error: TError,
): Promise<void> {
  await runSequential(interceptors, async (interceptor): Promise<void> => {
    await interceptor.onResponseError?.(context, error);
  });
}

async function runSequential<TData, TError>(
  interceptors: QueryInterceptor<TData, TError>[],
  executor: (interceptor: QueryInterceptor<TData, TError>) => Promise<void> | void,
): Promise<void> {
  return interceptors.reduce<Promise<void>>(async (pending, interceptor) => {
    await pending;
    await executor(interceptor);
  }, Promise.resolve());
}
