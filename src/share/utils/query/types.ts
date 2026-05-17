export type QueryKey = string | readonly unknown[];

export type QueryDedupeMode = 'join' | 'cancel' | 'none';

export type QueryInvalidateRefetchType = 'none' | 'active';

export type QueryStateStatus = 'idle' | 'pending' | 'success' | 'error';

export type QueryStaleTimeValue = number | 'static';

export interface QueryStaleTimeContext<TData = unknown, TError = unknown> {
  queryKey: QueryKey;
  keyHash: string;
  hasData: boolean;
  data?: TData;
  error: TError | null;
  updatedAt: number;
  status: QueryStateStatus;
}

export type QueryStaleTimeResolver<TData = unknown, TError = unknown> = (
  query: QueryStaleTimeContext<TData, TError>,
) => QueryStaleTimeValue;

export type QueryStaleTimeOption<TData = unknown, TError = unknown> =
  | QueryStaleTimeValue
  | QueryStaleTimeResolver<TData, TError>;

export interface QueryFnContext {
  queryKey: QueryKey;
  signal: AbortSignal;
  attempt: number;
  client: boolean;
  meta?: Record<string, unknown>;
}

export type QueryFn<TData> = (context: QueryFnContext) => Promise<TData>;

export type QueryRetryPredicate = (error: unknown, attempt: number) => boolean;

export type QueryRetryDelay = (attempt: number, error: unknown) => number;

export interface QueryLifecycleContext<TData, TError = unknown> {
  queryKey: QueryKey;
  keyHash: string;
  options: QueryOptions<TData, TError>;
  attempt: number;
  client: boolean;
}

export interface QueryInterceptor<TData, TError = unknown> {
  onRequest?: (context: QueryLifecycleContext<TData, TError>) => Promise<void> | void;
  onRequestError?: (context: QueryLifecycleContext<TData, TError>, error: TError) => Promise<void> | void;
  onResponse?: (context: QueryLifecycleContext<TData, TError>, data: TData) => Promise<void> | void;
  onResponseError?: (context: QueryLifecycleContext<TData, TError>, error: TError) => Promise<void> | void;
}

export interface QueryOptions<TData, TError = unknown> {
  queryKey: QueryKey;
  queryFn: QueryFn<TData>;
  autoExecute?: boolean;
  staleTime?: QueryStaleTimeOption<TData, TError>;
  gcTime?: number;
  retry?: number | QueryRetryPredicate;
  retryDelay?: number | QueryRetryDelay;
  dedupe?: QueryDedupeMode;
  signal?: AbortSignal;
  force?: boolean;
  meta?: Record<string, unknown>;
  onSuccess?: (data: TData) => Promise<void> | void;
  onError?: (error: TError) => Promise<void> | void;
  interceptors?: QueryInterceptor<TData, TError>[];
}

export interface QueryExecutionOptions<TData, TError = unknown> extends QueryOptions<TData, TError> {
  client: boolean;
  keyHash: string;
}

export interface QueryExecutionResult<TData, TError = unknown> {
  keyHash: string;
  isFromCache: boolean;
  status: 'success' | 'error';
  data?: TData;
  error?: TError | null;
}

export interface QueryCacheEntry<TData, TError = unknown> {
  hasData: boolean;
  data?: TData;
  error?: TError;
  updatedAt: number;
  status: QueryStateStatus;
  promise?: Promise<QueryExecutionResult<TData, TError>>;
  abortController?: AbortController;
  gcTime?: number;
  gcTimeoutId?: ReturnType<typeof setTimeout>;
}

export interface QueryCacheStore {
  get<TData, TError = unknown>(key: string): QueryCacheEntry<TData, TError> | undefined;
  set<TData, TError = unknown>(key: string, entry: QueryCacheEntry<TData, TError>): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}

export interface QueryCoreOptions {
  defaultRetry?: number;
  interceptors?: QueryInterceptor<unknown>[];
  now?: () => number;
}

export interface ClientQueryState<TData, TError = unknown> {
  status: QueryStateStatus;
  data?: TData;
  error: TError | null;
  isStale: boolean;
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface ClientQueryController<TData, TError = unknown> extends ClientQueryState<TData, TError> {
  subscribe: (listener: (state: ClientQueryState<TData, TError>) => void) => () => void;
  execute: (options?: { force?: boolean }) => Promise<ClientQueryState<TData, TError>>;
  refetch: () => Promise<ClientQueryState<TData, TError>>;
  cancel: () => void;
}

export interface ClientQueryClientOptions extends QueryCoreOptions {
  store?: QueryCacheStore;
}

export interface ClientQueryClient {
  createQuery: <TData, TError = unknown>(queryOptions: QueryOptions<TData, TError>) => ClientQueryController<TData, TError>;
  invalidate: (queryKey: QueryKey, options?: { exact?: boolean; refetchType?: QueryInvalidateRefetchType }) => boolean;
  clear: () => void;
}

export interface ServerQueryClientOptions extends QueryCoreOptions {
  store?: QueryCacheStore;
}

export interface ServerQueryOptions<TData, TError = unknown> extends QueryOptions<TData, TError> {
  swr?: number;
  tags?: string[];
}

export interface ServerQueryResult<TData, TError = unknown> {
  data?: TData;
  error: TError | null;
  isStale: boolean;
  keyHash: string;
  isFromCache: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface ServerQueryController<TData, TError = unknown> extends ServerQueryResult<TData, TError> {
  execute: (options?: { force?: boolean }) => Promise<ServerQueryResult<TData, TError>>;
  refetch: () => Promise<ServerQueryResult<TData, TError>>;
}

export interface ServerQueryClient {
  createQuery: <TData, TError = unknown>(queryOptions: ServerQueryOptions<TData, TError>) => ServerQueryController<TData, TError>;
  invalidate: (queryKey: QueryKey) => boolean;
  clear: () => void;
}

export interface AstroRouteCacheSetOptions {
  maxAge?: number;
  swr?: number;
  tags?: string[];
  lastModified?: Date;
  etag?: string;
}

export interface AstroRouteCacheLike {
  enabled?: boolean;
  set: (options: AstroRouteCacheSetOptions | false) => void;
}

export interface AstroCacheBridgeOptions {
  cache?: AstroRouteCacheLike;
  queryKey: QueryKey;
  staleTime?: QueryStaleTimeValue;
  swr?: number;
  tags?: string[];
}
