import { Err, Ok, isErr, isOk } from '@utils/result';

describe('Result helpers', () => {
  it('wraps success values', () => {
    const result = Ok('ready');

    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) {
      expect(result.value).toBe('ready');
    }
  });

  it('wraps failure values', () => {
    const error = new Error('boom');
    const result = Err(error);

    expect(isOk(result)).toBe(false);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe(error);
    }
  });
});
