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
});
