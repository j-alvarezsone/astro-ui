import { readJsonResponse } from '@utils/json/readJsonResponse';
import { ParseError } from '@utils/error/applicationError';

describe('readJsonResponse', () => {
  it('parses valid JSON responses as unknown values', async () => {
    const response = new Response('{"ok":true,"count":2}');

    const result = await readJsonResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ ok: true, count: 2 });
    }
  });

  it('throws for invalid JSON responses', async () => {
    const response = new Response('not-json');

    const result = await readJsonResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ParseError);
    }
  });
});