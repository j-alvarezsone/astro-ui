import './dropdown.web';

interface DropdownFixture {
  dropdown: HTMLElement;
  trigger: HTMLButtonElement;
  panel: HTMLElement;
}

async function flushMicrotask(): Promise<void> {
  await Promise.resolve();
}

function setupDropdownFixture(placementPreference?: string): DropdownFixture {
  document.body.innerHTML = `
    <app-dropdown data-placement-preference="${placementPreference ?? 'bottom-start'}">
      <button type="button" data-dropdown-trigger aria-expanded="false">Menu</button>
      <div data-dropdown-panel hidden>
        <a href="#" data-dropdown-item tabindex="0">Item 1</a>
        <a href="#" data-dropdown-item tabindex="0">Item 2</a>
        <a href="#" data-dropdown-item tabindex="0">Item 3</a>
      </div>
    </app-dropdown>
  `;

  const dropdown = document.querySelector('app-dropdown');
  const trigger = document.querySelector('[data-dropdown-trigger]');
  const panel = document.querySelector('[data-dropdown-panel]');

  if (!(dropdown instanceof HTMLElement)) {
    throw new Error('Dropdown fixture missing root element');
  }

  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error('Dropdown fixture missing trigger element');
  }

  if (!(panel instanceof HTMLElement)) {
    throw new Error('Dropdown fixture missing panel element');
  }

  return { dropdown, trigger, panel };
}

function setupTwoDropdowns(): { triggers: HTMLButtonElement[]; dropdowns: HTMLElement[] } {
  document.body.innerHTML = `
    <app-dropdown>
      <button type="button" data-dropdown-trigger aria-expanded="false">First</button>
      <div data-dropdown-panel hidden>
        <a href="#" data-dropdown-item tabindex="0">First item</a>
      </div>
    </app-dropdown>
    <app-dropdown>
      <button type="button" data-dropdown-trigger aria-expanded="false">Second</button>
      <div data-dropdown-panel hidden>
        <a href="#" data-dropdown-item tabindex="0">Second item</a>
      </div>
    </app-dropdown>
  `;

  const triggers = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-dropdown-trigger]'));
  const dropdowns = Array.from(document.querySelectorAll<HTMLElement>('app-dropdown'));

  if (triggers.length !== 2 || dropdowns.length !== 2) {
    throw new Error('Expected two dropdown fixtures');
  }

  return { triggers, dropdowns };
}

describe('dropdown.web', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1200 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 800 });
  });

  it('opens with Enter and closes with Escape', async () => {
    const { dropdown, trigger, panel } = setupDropdownFixture();
    await flushMicrotask();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(dropdown.dataset.open).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(dropdown.dataset.open).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('supports ArrowDown and ArrowUp menu focus navigation', async () => {
    const { trigger, panel } = setupDropdownFixture();
    await flushMicrotask();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    const items = Array.from(panel.querySelectorAll<HTMLElement>('[data-dropdown-item]'));
    expect(document.activeElement).toBe(items[0]);

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
  });

  it('flips to top when there is no room below', async () => {
    const { dropdown, trigger, panel } = setupDropdownFixture('bottom-start');
    await flushMicrotask();

    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 100,
          y: 740,
          width: 140,
          height: 32,
          top: 740,
          right: 240,
          bottom: 772,
          left: 100,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 0,
          y: 0,
          width: 320,
          height: 220,
          top: 0,
          right: 320,
          bottom: 220,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    trigger.click();

    expect(dropdown.dataset.side).toBe('top');
  });

  it('flips to left when there is no room on the right', async () => {
    const { dropdown, trigger, panel } = setupDropdownFixture('right-start');
    await flushMicrotask();

    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 1080,
          y: 220,
          width: 100,
          height: 40,
          top: 220,
          right: 1180,
          bottom: 260,
          left: 1080,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 0,
          y: 0,
          width: 280,
          height: 180,
          top: 0,
          right: 280,
          bottom: 180,
          left: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    trigger.click();

    expect(dropdown.dataset.side).toBe('left');
  });

  it('closes previously open dropdown when another opens with Enter', async () => {
    const { triggers, dropdowns } = setupTwoDropdowns();
    await flushMicrotask();

    triggers[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dropdowns[0]?.dataset.open).toBe('true');

    triggers[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(dropdowns[1]?.dataset.open).toBe('true');
    expect(dropdowns[0]?.dataset.open).toBe('false');
  });
});
