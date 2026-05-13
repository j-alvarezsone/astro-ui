import { HttpError, ValidationError } from '@utils/error/applicationError';
import { readJsonResponse } from '@utils/json/readJsonResponse';
import { isOk } from '@utils/result';

export interface FetchJsonResponseOptions<T> {
  init?: RequestInit;
  validate?: (value: unknown) => value is T;
}

interface FetchJsonResponseBaseOptions {
  init?: RequestInit;
}

interface FetchJsonResponseValidatedOptions<T> extends FetchJsonResponseBaseOptions {
  validate: (value: unknown) => value is T;
}

/**
 * Fetches JSON from a URL and throws typed application errors for HTTP and parse failures.
 *
 * @param input - Fetch input passed to `fetch`.
 * @param options - Optional fetch and validation options.
 * @returns Parsed JSON payload when a validator is provided, otherwise `unknown`.
 *
 * @example
 * const data = await fetchJsonResponse('/api/users');
 */
export async function fetchJsonResponse<T>(
  input: RequestInfo | URL,
  options: FetchJsonResponseValidatedOptions<T>,
): Promise<T>;

export async function fetchJsonResponse(
  input: RequestInfo | URL,
  options?: FetchJsonResponseBaseOptions,
): Promise<unknown>;

export async function fetchJsonResponse<T>(
  input: RequestInfo | URL,
  options: FetchJsonResponseOptions<T> = {},
): Promise<unknown> {
  const response = await fetch(input, options.init);

  if (!response.ok) {
    throw new HttpError(response.status, `HTTP ${response.status}`);
  }

  const data = await readJsonResponse(response);

  if (!isOk(data)) {
    throw data.error;
  }

  if (options.validate) {
    if (!options.validate(data.value)) {
      throw new ValidationError('Invalid JSON response', { value: data.value });
    }

    return data.value;
  }

  return data.value;
}
