import { hashQueryKey } from '@utils/query/key';

describe('query key hashing', () => {
  it('produces the same hash for semantically identical query keys', () => {
    const first = hashQueryKey([{ b: 2, a: 1 }]);
    const second = hashQueryKey([{ a: 1, b: 2 }]);

    expect(first).toBe(second);
  });

  it('produces a stable hash for nested arrays and objects', () => {
    const first = hashQueryKey(['user', { id: 1, roles: ['admin', 'editor'] }]);
    const second = hashQueryKey(['user', { roles: ['admin', 'editor'], id: 1 }]);

    expect(first).toBe(second);
  });

  it('normalizes nested object keys and array values consistently', () => {
    const first = hashQueryKey([
      'session',
      {
        user: { name: 'Alice', metadata: { lastSeen: 1, device: 'mobile' } },
        roles: ['editor', 'admin'],
      },
    ]);

    const second = hashQueryKey([
      'session',
      {
        roles: ['editor', 'admin'],
        user: { metadata: { device: 'mobile', lastSeen: 1 }, name: 'Alice' },
      },
    ]);

    expect(first).toBe(second);
  });

  it('keeps array element order but sorts object properties recursively', () => {
    const first = hashQueryKey(['items', [{ id: 2, name: 'b' }, { id: 1, name: 'a' }]]);
    const second = hashQueryKey(['items', [{ name: 'b', id: 2 }, { name: 'a', id: 1 }]]);

    expect(first).toBe(second);
  });

  it('serializes primitive values and nested objects deterministically', () => {
    const value = ['status', null, 123, { b: true, a: false }];

    expect(hashQueryKey(value)).toBe(JSON.stringify(['status', null, 123, { a: false, b: true }]));
  });
});
