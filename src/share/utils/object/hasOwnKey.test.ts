import { hasOwnKey } from '@utils/object/hasOwnKey';

describe('hasOwnKey', () => {
  it('returns true for direct own string keys', () => {
    const obj = { warm: true, count: 1 };

    expect(hasOwnKey(obj, 'warm')).toBe(true);
    expect(hasOwnKey(obj, 'count')).toBe(true);
  });

  it('returns false for missing keys', () => {
    const obj = { warm: true };

    expect(hasOwnKey(obj, 'cool')).toBe(false);
  });

  it('returns false for inherited Object.prototype keys when not own', () => {
    const obj = { warm: true };

    expect(hasOwnKey(obj, 'toString')).toBe(false);
    expect(hasOwnKey(obj, 'constructor')).toBe(false);
  });

  it('returns true when a prototype-like key is defined as an own key', () => {
    const obj = { toString: 'custom' };

    expect(hasOwnKey(obj, 'toString')).toBe(true);
  });

  it('supports symbol keys', () => {
    const symbolKey = Symbol('theme');
    const obj: Record<string | symbol, string> = {
      [symbolKey]: 'warm',
    };

    expect(hasOwnKey(obj, symbolKey)).toBe(true);
    expect(hasOwnKey(obj, Symbol('theme'))).toBe(false);
  });
});
