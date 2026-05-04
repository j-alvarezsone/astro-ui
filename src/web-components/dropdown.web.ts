import type { ValueOf } from '@/types/index';

const APP_DROPDOWN_TAG = 'app-dropdown' as const;
const DROPDOWN_OPEN_EVENT = 'dropdown:open' as const;
const TRIGGER_SELECTOR = '[data-dropdown-trigger]' as const;
const PANEL_SELECTOR = '[data-dropdown-panel]' as const;
const ITEM_SELECTOR = '[data-dropdown-item], [role="menuitem"], a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])' as const;

const PLACEMENT_SIDE = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

const PLACEMENT_ALIGN = {
  START: 'start',
  END: 'end',
  CENTER: 'center',
} as const;
const PLACEMENT_SIDES = [PLACEMENT_SIDE.TOP, PLACEMENT_SIDE.BOTTOM, PLACEMENT_SIDE.LEFT, PLACEMENT_SIDE.RIGHT] as const;
const PLACEMENT_ALIGNS = [PLACEMENT_ALIGN.START, PLACEMENT_ALIGN.END, PLACEMENT_ALIGN.CENTER] as const;

const DEFAULT_PLACEMENT_PREFERENCE = `${PLACEMENT_SIDE.BOTTOM}-${PLACEMENT_ALIGN.START}`;
const ALIGN_CANDIDATES: Record<PlacementAlign, PlacementAlign[]> = {
  [PLACEMENT_ALIGN.START]: [PLACEMENT_ALIGN.START, PLACEMENT_ALIGN.END, PLACEMENT_ALIGN.CENTER],
  [PLACEMENT_ALIGN.END]: [PLACEMENT_ALIGN.END, PLACEMENT_ALIGN.START, PLACEMENT_ALIGN.CENTER],
  [PLACEMENT_ALIGN.CENTER]: [PLACEMENT_ALIGN.CENTER, PLACEMENT_ALIGN.START, PLACEMENT_ALIGN.END],
};

const VIEWPORT_MARGIN = 10;
const PLACEMENT_GAP = 8;

type PlacementSide = ValueOf<typeof PLACEMENT_SIDE>;
type PlacementAlign = ValueOf<typeof PLACEMENT_ALIGN>;
type DropdownOpenEventDetail = {
  source: AppDropdown | null;
};

/**
 * Checks whether a runtime value matches the dropdown open event payload shape.
 *
 * @param value Runtime detail payload from a custom event.
 * @returns True when payload has a valid `source` value.
 */
function isDropdownOpenEventDetail(value: unknown): value is DropdownOpenEventDetail {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!Object.hasOwn(value, 'source')) {
    return false;
  }

  let source: unknown;
  for (const [key, entryValue] of Object.entries(value)) {
    if (key === 'source') {
      source = entryValue;
      break;
    }
  }

  return source === null || source instanceof AppDropdown;
}

interface Position {
  top: number;
  left: number;
  side: PlacementSide;
  align: PlacementAlign;
}

/**
 * Limits a numeric value to a min/max range.
 *
 * @param value Value to clamp.
 * @param min Minimum allowed value.
 * @param max Maximum allowed value.
 * @returns Clamped number.
 * @example
 * ```ts
 * const result = clamp(15, 0, 10);
 * // result === 10
 * ```
 */
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Checks whether a string is one of the supported placement sides.
 *
 * @param value Raw side value.
 * @returns True when the value matches a supported side.
 * @example
 * ```ts
 * const isSide = isPlacementSide('right');
 * // isSide === true
 * ```
 */
function isPlacementSide(value: string): value is PlacementSide {
  return PLACEMENT_SIDES.some((side) => side === value);
}

/**
 * Checks whether a string is one of the supported placement alignments.
 *
 * @param value Raw alignment value.
 * @returns True when the value matches a supported alignment.
 * @example
 * ```ts
 * const isAlign = isPlacementAlign('center');
 * // isAlign === true
 * ```
 */
function isPlacementAlign(value: string): value is PlacementAlign {
  return PLACEMENT_ALIGNS.some((align) => align === value);
}

/**
 * Parses dataset placement preference into side and alignment pieces.
 *
 * @param preference Raw placement string such as "bottom-start".
 * @returns Parsed side + alignment with safe defaults.
 * @example
 * ```ts
 * const parsed = parsePlacement('right-start');
 * // parsed.side === PLACEMENT_SIDE.RIGHT
 * // parsed.align === PLACEMENT_ALIGN.START
 * ```
 */
function parsePlacement(preference: string | undefined): { side: PlacementSide; align: PlacementAlign } {
  const [sideRaw, alignRaw] = (preference ?? DEFAULT_PLACEMENT_PREFERENCE).split('-');
  const side = isPlacementSide(sideRaw) ? sideRaw : PLACEMENT_SIDE.BOTTOM;
  const align = isPlacementAlign(alignRaw) ? alignRaw : PLACEMENT_ALIGN.START;

  return { side, align };
}

/**
 * Gets dropdown items that can receive focus for keyboard navigation.
 *
 * @param panel Dropdown panel element.
 * @returns Focusable dropdown items in DOM order.
 * @example
 * ```ts
 * const items = getFocusableItems(panelEl);
 * // items[0]?.focus()
 * ```
 */
function getFocusableItems(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter((item) => !item.hasAttribute('disabled'));
}

/**
 * Resolves a panel start coordinate on one axis using alignment semantics.
 *
 * @param anchorStart Trigger start coordinate on the axis.
 * @param anchorSize Trigger size on the axis.
 * @param panelSize Panel size on the axis.
 * @param align Requested alignment for that axis.
 * @returns Axis start coordinate for the panel.
 * @example
 * ```ts
 * const left = getAlignedAxisStart(triggerRect.left, triggerRect.width, panelRect.width, PLACEMENT_ALIGN.CENTER);
 * // left positions the panel centered to the trigger.
 * ```
 */
function getAlignedAxisStart(
  anchorStart: number,
  anchorSize: number,
  panelSize: number,
  align: PlacementAlign,
): number {
  if (align === PLACEMENT_ALIGN.START) {
    return anchorStart;
  }

  if (align === PLACEMENT_ALIGN.END) {
    return anchorStart + anchorSize - panelSize;
  }

  return anchorStart + (anchorSize - panelSize) / 2;
}

/**
 * Calculates top/left coordinates for a side + align combination.
 *
 * @param triggerRect Trigger element bounding box.
 * @param panelRect Dropdown panel bounding box.
 * @param side Placement side.
 * @param align Placement alignment.
 * @returns Raw top/left coordinates before clamping.
 * @example
 * ```ts
 * const coords = computeRawPosition(triggerRect, panelRect, PLACEMENT_SIDE.BOTTOM, PLACEMENT_ALIGN.START);
 * // coords.top and coords.left can be assigned to style properties.
 * ```
 */
function computeRawPosition(
  triggerRect: DOMRect,
  panelRect: DOMRect,
  side: PlacementSide,
  align: PlacementAlign,
): { top: number; left: number } {
  if (side === PLACEMENT_SIDE.BOTTOM || side === PLACEMENT_SIDE.TOP) {
    const top =
      side === PLACEMENT_SIDE.BOTTOM ? triggerRect.bottom + PLACEMENT_GAP : triggerRect.top - panelRect.height - PLACEMENT_GAP;
    const left = getAlignedAxisStart(triggerRect.left, triggerRect.width, panelRect.width, align);

    return { top, left };
  }

  const left =
    side === PLACEMENT_SIDE.RIGHT ? triggerRect.right + PLACEMENT_GAP : triggerRect.left - panelRect.width - PLACEMENT_GAP;
  const top = getAlignedAxisStart(triggerRect.top, triggerRect.height, panelRect.height, align);

  return { top, left };
}

/**
 * Chooses the best panel side using viewport space and preferred side.
 *
 * @param triggerRect Trigger element box.
 * @param panelRect Panel element box.
 * @param preferred Preferred side from props.
 * @returns Selected side that best fits the viewport.
 * @example
 * ```ts
 * const side = resolveSide(triggerRect, panelRect, PLACEMENT_SIDE.BOTTOM);
 * // side can flip to PLACEMENT_SIDE.TOP if needed.
 * ```
 */
function resolveSide(triggerRect: DOMRect, panelRect: DOMRect, preferred: PlacementSide): PlacementSide {
  const spaceAbove = triggerRect.top - VIEWPORT_MARGIN;
  const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN;
  const spaceLeft = triggerRect.left - VIEWPORT_MARGIN;
  const spaceRight = window.innerWidth - triggerRect.right - VIEWPORT_MARGIN;

  if (preferred === PLACEMENT_SIDE.BOTTOM || preferred === PLACEMENT_SIDE.TOP) {
    const preferredSpace = preferred === PLACEMENT_SIDE.BOTTOM ? spaceBelow : spaceAbove;
    const oppositeSpace = preferred === PLACEMENT_SIDE.BOTTOM ? spaceAbove : spaceBelow;
    const oppositeSide: PlacementSide = preferred === PLACEMENT_SIDE.BOTTOM ? PLACEMENT_SIDE.TOP : PLACEMENT_SIDE.BOTTOM;

    if (preferredSpace >= panelRect.height + PLACEMENT_GAP) return preferred;
    if (oppositeSpace >= panelRect.height + PLACEMENT_GAP) return oppositeSide;
    return preferredSpace >= oppositeSpace ? preferred : oppositeSide;
  }

  const preferredSpace = preferred === PLACEMENT_SIDE.RIGHT ? spaceRight : spaceLeft;
  const oppositeSpace = preferred === PLACEMENT_SIDE.RIGHT ? spaceLeft : spaceRight;
  const oppositeSide: PlacementSide = preferred === PLACEMENT_SIDE.RIGHT ? PLACEMENT_SIDE.LEFT : PLACEMENT_SIDE.RIGHT;

  if (preferredSpace >= panelRect.width + PLACEMENT_GAP) return preferred;
  if (oppositeSpace >= panelRect.width + PLACEMENT_GAP) return oppositeSide;

  return preferredSpace >= oppositeSpace ? preferred : oppositeSide;
}

class AppDropdown extends HTMLElement {
  #controller: AbortController | null = null;
  #trigger: HTMLButtonElement | null = null;
  #panel: HTMLElement | null = null;
  #open = false;

  connectedCallback() {
    if (this.#controller) return;

    this.#controller = new AbortController();
    queueMicrotask(() => this.#setup());
  }

  /**
   * Binds runtime listeners after the element's child nodes are available.
   *
   * @returns Nothing.
   * @example
   * ```ts
   * queueMicrotask(() => this.setup());
   * ```
   */
  #setup() {
    if (!this.isConnected || !this.#controller) return;
    if (this.#trigger) return;

    this.#trigger = this.querySelector(TRIGGER_SELECTOR);
    this.#panel = this.querySelector(PANEL_SELECTOR);

    if (!this.#controller || !this.#trigger || !this.#panel) return;

    const { signal } = this.#controller;

    this.#trigger.addEventListener(
      'click',
      () => {
        this.#setOpen(!this.#open);
      },
      { signal },
    );

    this.#trigger.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.#setOpen(true, { focusFirstItem: true });
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.#setOpen(true, { focusFirstItem: true });
        }
      },
      { signal },
    );

    this.#panel.addEventListener('keydown', (event) => this.#handlePanelKeydown(event), { signal });

    document.addEventListener(
      'click',
      (event) => {
        if (!this.#open) return;
        const target = event.target;

        if (!(target instanceof Node)) return;
        if (this.contains(target)) return;

        this.#setOpen(false);
      },
      { signal },
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if (!this.#open) return;
        if (event.key !== 'Escape') return;

        event.preventDefault();
        this.#setOpen(false, { returnFocus: true });
      },
      { signal },
    );

    const onDropdownOpen: EventListener = (event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail: unknown = event.detail;

      if (!isDropdownOpenEventDetail(detail)) return;
      if (detail.source === this) return;

      this.#setOpen(false);
    };

    document.addEventListener(DROPDOWN_OPEN_EVENT, onDropdownOpen, { signal });

    window.addEventListener('resize', () => this.#updatePlacement(), { signal });
    window.addEventListener('scroll', () => this.#updatePlacement(), { signal, capture: true, passive: true });

    this.#setOpen(false);
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
    this.#trigger = null;
    this.#panel = null;
  }

  /**
   * Handles keyboard navigation while focus is inside the panel.
   *
   * @param event Keyboard event from the dropdown panel.
   * @returns Nothing.
   * @example
   * ```ts
   * panel.addEventListener('keydown', (event) => handlePanelKeydown(event));
   * ```
   */
  #handlePanelKeydown(event: KeyboardEvent) {
    if (!this.#panel) return;

    const items = getFocusableItems(this.#panel);
    if (items.length === 0) return;

    const activeElement = document.activeElement;
    const currentIndex = activeElement instanceof HTMLElement ? items.indexOf(activeElement) : -1;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.#setOpen(false, { returnFocus: true });
      return;
    }

    if (event.key === 'Enter' && activeElement instanceof HTMLElement && activeElement.matches(ITEM_SELECTOR)) {
      this.#setOpen(false);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();

    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const fallbackIndex = direction > 0 ? 0 : items.length - 1;
    const nextIndex = currentIndex < 0 ? fallbackIndex : (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  /**
   * Applies open/close state with aria synchronization and optional focus control.
   *
   * @param open Whether the dropdown should be open.
   * @param options Optional focus behaviors.
   * @returns Nothing.
   * @example
   * ```ts
   * this.setOpen(true, { focusFirstItem: true });
   * ```
   */
  #setOpen(open: boolean, options: { focusFirstItem?: boolean; returnFocus?: boolean } = {}) {
    if (!this.#trigger || !this.#panel) return;

    this.#open = open;
    this.dataset.open = open ? 'true' : 'false';
    this.#trigger.setAttribute('aria-expanded', String(open));

    if (open) {
      document.dispatchEvent(new CustomEvent<DropdownOpenEventDetail>(DROPDOWN_OPEN_EVENT, { detail: { source: this } }));
    }

    if (!open) {
      this.#panel.hidden = true;
      if (options.returnFocus) {
        this.#trigger.focus();
      }
      return;
    }

    this.#panel.hidden = false;
    this.#updatePlacement();

    if (options.focusFirstItem) {
      const items = getFocusableItems(this.#panel);
      items[0]?.focus();
    }
  }

  /**
   * Computes panel coordinates and flips side/alignment when space is constrained.
   *
   * @returns Nothing.
   * @example
   * ```ts
   * this.updatePlacement();
   * ```
   */
  #updatePlacement() {
    if (!this.#open || !this.#trigger || !this.#panel) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const panelRect = this.#panel.getBoundingClientRect();
    const { side: preferredSide, align: preferredAlign } = parsePlacement(this.dataset.placementPreference);

    const side = resolveSide(triggerRect, panelRect, preferredSide);
    const alignCandidates = ALIGN_CANDIDATES[preferredAlign];

    let selected: Position | null = null;

    for (const align of alignCandidates) {
      const raw = computeRawPosition(triggerRect, panelRect, side, align);
      const top = clamp(raw.top, VIEWPORT_MARGIN, window.innerHeight - panelRect.height - VIEWPORT_MARGIN);
      const left = clamp(raw.left, VIEWPORT_MARGIN, window.innerWidth - panelRect.width - VIEWPORT_MARGIN);

      const overflowX = Math.abs(raw.left - left);
      const overflowY = Math.abs(raw.top - top);
      const overflowPenalty = overflowX + overflowY;

      if (!selected || overflowPenalty < Math.abs(selected.left - raw.left) + Math.abs(selected.top - raw.top)) {
        selected = { top, left, side, align };
      }

      if (overflowPenalty === 0) break;
    }

    if (!selected) return;

    this.#panel.style.top = `${selected.top}px`;
    this.#panel.style.left = `${selected.left}px`;
    this.dataset.side = selected.side;
    this.dataset.align = selected.align;
  }
}

if (!customElements.get(APP_DROPDOWN_TAG)) {
  customElements.define(APP_DROPDOWN_TAG, AppDropdown);
}
