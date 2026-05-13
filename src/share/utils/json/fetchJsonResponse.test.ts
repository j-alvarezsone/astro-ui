import { HttpError } from '@utils/error/applicationError';
import { ParseError } from '@utils/error/applicationError';
import { ValidationError } from '@utils/error/applicationError';
import { fetchJsonResponse } from '@utils/json/fetchJsonResponse';

describe('fetchJsonResponse', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON for ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('{"ok":true}')));

    await expect(fetchJsonResponse('/api/test')).resolves.toEqual({ ok: true });
  });

  it('throws HttpError for non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('not found', { status: 404 }))); 

    await expect(fetchJsonResponse('/api/test')).rejects.toBeInstanceOf(HttpError);
  });

  it('throws parse errors for invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('not-json')));

    await expect(fetchJsonResponse('/api/test')).rejects.toBeInstanceOf(ParseError);
  });

  it('validates and returns typed payloads when a validator is provided', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('{"value":42}')));

    const result = await fetchJsonResponse<{ value: number }>('/api/test', {
      validate: (value): value is { value: number } => typeof value === 'object' && value !== null && 'value' in value,
    });

    expect(result).toEqual({ value: 42 });
  });

  it('throws ValidationError when validator fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('{"value":42}')));

    await expect(
      fetchJsonResponse<{ value: string }>('/api/test', {
        validate: (value): value is { value: string } =>
          typeof value === 'object' && value !== null && 'value' in value && typeof value.value === 'string',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});