import { Err, Ok, type Result } from '@utils/result';
import { ParseError } from '@utils/error/applicationError';

/**
 * Reads a `Response` body as a `Result` with explicit JSON parse failure handling.
 *
 * @param response - Fetch response to read.
 * @returns Successful parsed JSON or a `ParseError` failure.
 *
 * @example
 * const result = await readJsonResponse(new Response('{"ok":true}'));
 */
export async function readJsonResponse(response: Response): Promise<Result<unknown, ParseError>> {
  const text = await response.text();

  return parseJson(text);
}

/**
 * Parses JSON text into a `Result`.
 *
 * @param text - JSON string content.
 * @returns Successful parsed JSON or a `ParseError` failure.
 */
function parseJson(text: string): Result<unknown, ParseError> {
  try {
    const value: unknown = JSON.parse(text);

    return Ok(value);
  } catch (error) {
    return Err(error instanceof SyntaxError ? new ParseError('Invalid JSON response', { cause: error.message }) : new ParseError('Invalid JSON response'));
  }
}