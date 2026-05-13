import { isUnknownRecord } from '@utils/object/isUnknownRecord';

describe('isUnknownRecord', () => {
  it('returns true for plain objects', () => {
    expect(isUnknownRecord({ id: 1 })).toBe(true);
    expect(isUnknownRecord({})).toBe(true);
  });

  it('returns false for null and non-objects', () => {
    expect(isUnknownRecord(null)).toBe(false);
    expect(isUnknownRecord(undefined)).toBe(false);
    expect(isUnknownRecord('text')).toBe(false);
    expect(isUnknownRecord(123)).toBe(false);
    expect(isUnknownRecord(true)).toBe(false);
  });

  it('returns true for arrays because they are object records', () => {
    expect(isUnknownRecord([])).toBe(true);
  });
});
