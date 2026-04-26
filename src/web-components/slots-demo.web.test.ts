import './slots-demo.web';

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function buildDemo(
  items: { selector: string }[],
  previewHtml: string,
): HTMLElement {
  const el = document.createElement('slots-demo');
  el.innerHTML = `
    <div data-slots-preview>${previewHtml}</div>
    ${items
      .map((i) => `<div data-slots-item="${i.selector}" tabindex="0"></div>`)
      .join('')}
  `;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SlotsDemoElement', () => {
  it('adds data-slots-highlight to targets on mouseenter', () => {
    const el = buildDemo([{ selector: '.chip' }], '<span class="chip">Label</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;
    const target = el.querySelector<HTMLElement>('.chip')!;

    item.dispatchEvent(new MouseEvent('mouseenter'));

    expect(item.hasAttribute('data-slots-active')).toBe(true);
    expect(target.hasAttribute('data-slots-highlight')).toBe(true);
  });

  it('removes data-slots-highlight on mouseleave', () => {
    const el = buildDemo([{ selector: '.chip' }], '<span class="chip">Label</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;
    const target = el.querySelector<HTMLElement>('.chip')!;

    item.dispatchEvent(new MouseEvent('mouseenter'));
    item.dispatchEvent(new MouseEvent('mouseleave'));

    expect(item.hasAttribute('data-slots-active')).toBe(false);
    expect(target.hasAttribute('data-slots-highlight')).toBe(false);
  });

  it('activates on focus and deactivates on blur', () => {
    const el = buildDemo([{ selector: '.chip' }], '<span class="chip">Label</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;
    const target = el.querySelector<HTMLElement>('.chip')!;

    item.dispatchEvent(new FocusEvent('focus'));
    expect(item.hasAttribute('data-slots-active')).toBe(true);
    expect(target.hasAttribute('data-slots-highlight')).toBe(true);

    item.dispatchEvent(new FocusEvent('blur'));
    expect(item.hasAttribute('data-slots-active')).toBe(false);
    expect(target.hasAttribute('data-slots-highlight')).toBe(false);
  });

  it('highlights multiple matching targets', () => {
    const el = buildDemo([{ selector: '.chip' }], '<span class="chip">A</span><span class="chip">B</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;
    const targets = el.querySelectorAll<HTMLElement>('.chip');

    item.dispatchEvent(new MouseEvent('mouseenter'));

    targets.forEach((t) => {
      expect(t.hasAttribute('data-slots-highlight')).toBe(true);
    });
  });

  it('does nothing for an item whose selector matches nothing', () => {
    const el = buildDemo([{ selector: '.missing' }], '<span class="chip">Label</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;

    item.dispatchEvent(new MouseEvent('mouseenter'));

    expect(item.hasAttribute('data-slots-active')).toBe(false);
  });

  it('cleans up listeners on disconnect', () => {
    const el = buildDemo([{ selector: '.chip' }], '<span class="chip">Label</span>');
    const item = el.querySelector<HTMLElement>('[data-slots-item]')!;
    const target = el.querySelector<HTMLElement>('.chip')!;

    el.remove();
    item.dispatchEvent(new MouseEvent('mouseenter'));

    expect(item.hasAttribute('data-slots-active')).toBe(false);
    expect(target.hasAttribute('data-slots-highlight')).toBe(false);
  });

  it('skips a slot item with an invalid CSS selector without throwing', () => {
    // "::invalid-pseudo" is not a valid selector — querySelectorAll throws a DOMException
    expect(() => {
      buildDemo(
        [{ selector: '::invalid-pseudo' }, { selector: '.chip' }],
        '<span class="chip">Label</span>',
      );
    }).not.toThrow();

    const el = document.querySelector('slots-demo')!;
    const items = el.querySelectorAll<HTMLElement>('[data-slots-item]');
    const validItem = items[1];
    const target = el.querySelector<HTMLElement>('.chip')!;

    // the valid item still works despite the bad one
    validItem.dispatchEvent(new MouseEvent('mouseenter'));
    expect(target.hasAttribute('data-slots-highlight')).toBe(true);
  });
});
