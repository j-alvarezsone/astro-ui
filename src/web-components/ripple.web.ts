const RIPPLE_ANIM_DURATION = 600;

const rippleStyles = `
  @keyframes ripple-drop {
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  ripple-effect {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
  }
`;

class RippleEffect extends HTMLElement {
  #controller: AbortController | null = null;
  #styleEl: HTMLStyleElement | null = null;

  connectedCallback(): void {
    this.#injectStyles();

    const host = this.parentElement;
    if (!host) return;

    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const useTouch = 'ontouchstart' in document.documentElement;

    if (useTouch) {
      host.addEventListener('touchstart', (e) => this.#handleEvent(e, host), {
        passive: true,
        signal,
      });
    } else {
      host.addEventListener('mousedown', (e) => this.#handleEvent(e, host), { signal });
    }
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
    this.#styleEl?.remove();
    this.#styleEl = null;
  }

  #handleEvent(e: MouseEvent | TouchEvent, host: HTMLElement): void {
    if (this.dataset.disabled === 'true') return;

    const rect = host.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const posX = clientX - rect.left;
    const posY = clientY - rect.top;

    const background = this.dataset.background ?? 'rgba(255, 255, 255, 0.4)';
    const size = Math.max(host.offsetWidth, host.offsetHeight);

    const span = document.createElement('span');
    span.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      top: ${posY - size / 2}px;
      left: ${posX - size / 2}px;
      border-radius: 50%;
      background: ${background};
      transform: scale(0);
      opacity: 1;
      animation: ripple-drop ${RIPPLE_ANIM_DURATION / 1000}s linear forwards;
      pointer-events: none;
    `;

    this.appendChild(span);
    setTimeout(() => span.remove(), RIPPLE_ANIM_DURATION);
  }

  #injectStyles(): void {
    if (document.querySelector('style[data-ripple-styles]')) return;

    this.#styleEl = document.createElement('style');
    this.#styleEl.setAttribute('data-ripple-styles', '');
    this.#styleEl.textContent = rippleStyles;
    document.head.appendChild(this.#styleEl);
  }
}

customElements.define('ripple-effect', RippleEffect);
