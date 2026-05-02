
const INPUT_SELECTOR = '.input-password' as const;
const ICON_SELECTOR = '.input-password-icon' as const;
const ICON_USE_SELECTOR = `${ICON_SELECTOR} use` as const;
const ICON_SYMBOL_SELECTOR = `${ICON_SELECTOR} symbol` as const;
const EYE_SYMBOL_ID = 'ai:mdi:eye-outline' as const;
const EYE_OFF_SYMBOL_ID = 'ai:mdi:eye-off-outline' as const;
const EYE_ICON_NAME = 'mdi:eye-outline' as const;
const EYE_OFF_ICON_NAME = 'mdi:eye-off-outline' as const;

class InputPassword extends HTMLElement {
  #controller: AbortController | null = null;
  #input: HTMLInputElement | null = null;
  #icon: HTMLElement | null = null;
  #iconUse: SVGUseElement | null = null;
  #iconSymbol: SVGSymbolElement | null = null;

  connectedCallback() {
    this.#controller = new AbortController();
    this.#input = this.querySelector(INPUT_SELECTOR);
    this.#icon = this.querySelector(ICON_SELECTOR);
    this.#iconUse = this.querySelector(ICON_USE_SELECTOR);
    this.#iconSymbol = this.querySelector(ICON_SYMBOL_SELECTOR);

    const { signal } = this.#controller;

    this.#icon?.addEventListener('click', () => this.handleIconClick(), { signal });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
    this.#input = null;
    this.#icon = null;
    this.#iconUse = null;
  }

  handleIconClick() {
    if (!this.#input) return;

    const type = this.#input.getAttribute('type') === 'password' ? 'text' : 'password';
    this.#input.setAttribute('type', type);

    if (!this.#iconUse) return;

    const symbolId = type === 'password' ? EYE_SYMBOL_ID : EYE_OFF_SYMBOL_ID;
    const iconName = type === 'password' ? EYE_ICON_NAME : EYE_OFF_ICON_NAME;
    const href = `#${symbolId}`;

    this.#iconUse.setAttribute('href', href);
    this.#icon?.setAttribute('data-icon', iconName);
    this.#iconSymbol?.setAttribute('id', symbolId);
  }
}

customElements.define('input-password', InputPassword);
