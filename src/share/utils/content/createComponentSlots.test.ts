import { describe, expect, it } from 'vitest';
import { createComponentSlots } from './createComponentSlots';

describe('createComponentSlots', () => {
  it('maps root to the block selector', () => {
    expect(createComponentSlots('chips', ['root'])).toEqual([{ name: 'root', selector: '.chips' }]);
  });

  it('maps non-root names to BEM element selectors', () => {
    expect(createComponentSlots('chips', ['image', 'icon', 'label'])).toEqual([
      { name: 'image', selector: '.chips__image' },
      { name: 'icon', selector: '.chips__icon' },
      { name: 'label', selector: '.chips__label' },
    ]);
  });

  it('converts camelCase names to kebab-case selectors', () => {
    expect(createComponentSlots('chips', ['removeIcon'])).toEqual([
      { name: 'removeIcon', selector: '.chips__remove-icon' },
    ]);
  });

  it('returns an empty array when no slots are provided', () => {
    expect(createComponentSlots('chips', [])).toEqual([]);
  });

  it('uses selectorOverrides for slots whose actual selector deviates from BEM', () => {
    expect(
      createComponentSlots('input-field', ['root', 'label', 'helpText', 'errorText'], {
        label: '.input-label',
        helpText: '.input-field__help',
        errorText: '.input-field__error',
      }),
    ).toEqual([
      { name: 'root', selector: '.input-field' },
      { name: 'label', selector: '.input-label' },
      { name: 'helpText', selector: '.input-field__help' },
      { name: 'errorText', selector: '.input-field__error' },
    ]);
  });

  it('only overrides the specified slots, leaving others as BEM-derived', () => {
    expect(
      createComponentSlots('input-field', ['root', 'wrapper', 'label'], {
        label: '.input-label',
      }),
    ).toEqual([
      { name: 'root', selector: '.input-field' },
      { name: 'wrapper', selector: '.input-field__wrapper' },
      { name: 'label', selector: '.input-label' },
    ]);
  });
});
