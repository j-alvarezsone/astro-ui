import {
  mergePassThroughAttributes,
  splitPassThroughAttributes,
} from '@utils/theme/passThrough';

describe('mergePassThroughAttributes', () => {
  it('merges classes and styles while allowing override attributes to win', () => {
    const merged = mergePassThroughAttributes(
      {
        class: 'base-class',
        style: 'color: red;',
        'data-size': 'md',
      },
      {
        class: ['override-class'],
        style: 'background: blue;',
        'data-size': 'lg',
        'data-slot': 'input',
      },
    );

    expect(merged).toEqual({
      class: ['base-class', 'override-class'],
      style: 'color: red; background: blue',
      'data-size': 'lg',
      'data-slot': 'input',
    });
  });

  it('merges style objects and style strings into one CSS text', () => {
    const merged = mergePassThroughAttributes(
      {
        style: {
          '--label-start': '10px',
          backgroundColor: 'white',
        },
      },
      {
        style: 'border-color: red;',
      },
    );

    expect(merged).toEqual({
      style: '--label-start: 10px; background-color: white; border-color: red',
    });
  });

  it('returns undefined when both inputs are empty', () => {
    expect(mergePassThroughAttributes(undefined, undefined)).toBeUndefined();
  });

  it('returns base attributes when override is undefined', () => {
    expect(mergePassThroughAttributes({ class: 'foo' }, undefined)).toEqual({ class: ['foo'] });
  });

  it('returns override attributes when base is undefined', () => {
    expect(mergePassThroughAttributes(undefined, { class: 'bar' })).toEqual({ class: ['bar'] });
  });
});

describe('splitPassThroughAttributes', () => {
  it('splits class from remaining attributes', () => {
    const result = splitPassThroughAttributes({ class: ['foo'], id: 'field-1' });

    expect(result).toEqual({
      className: ['foo'],
      attributes: { id: 'field-1' },
    });
  });

  it('returns undefined attributes when no non-class keys exist', () => {
    const result = splitPassThroughAttributes({ class: 'solo' });

    expect(result).toEqual({
      className: 'solo',
      attributes: undefined,
    });
  });

  it('returns undefined className and attributes when input is undefined', () => {
    const result = splitPassThroughAttributes(undefined);

    expect(result).toEqual({
      className: undefined,
      attributes: undefined,
    });
  });

  it('returns undefined className when class is absent', () => {
    const result = splitPassThroughAttributes({ id: 'x' });

    expect(result).toEqual({
      className: undefined,
      attributes: { id: 'x' },
    });
  });
});
