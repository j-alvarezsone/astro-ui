const RIPPLE_ANIM_DURATION = 600;

const rippleStyles = `
  @keyframes ripple-drop {
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  astro-ripple {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
  }
`;

class AstroRipple extends HTMLElement {
  private handleEvent: ((e: MouseEvent | TouchEvent) => void) | null = null;
  private host: HTMLElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private useTouch = false;

  connectedCallback(): void {
    this.injectStyles();

    this.host = this.parentElement;
    if (!this.host) return;

    this.handleEvent = (e: MouseEvent | TouchEvent) => {
      if (!this.host || this.dataset.disabled === 'true') return;

      const rect = this.host.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const posX = clientX - rect.left;
      const posY = clientY - rect.top;

      const background = this.dataset.background ?? 'rgba(255, 255, 255, 0.4)';
      const size = Math.max(this.host.offsetWidth, this.host.offsetHeight);

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

      setTimeout(() => {
        span.remove();
      }, RIPPLE_ANIM_DURATION);
    };

    this.useTouch = 'ontouchstart' in document.documentElement;

    if (this.useTouch) {
      this.host.addEventListener('touchstart', this.handleEvent, { passive: true });
    } else {
      this.host.addEventListener('mousedown', this.handleEvent);
    }
  }

  disconnectedCallback(): void {
    if (this.host && this.handleEvent) {
      if (this.useTouch) {
        this.host.removeEventListener('touchstart', this.handleEvent);
      } else {
        this.host.removeEventListener('mousedown', this.handleEvent);
      }
    }

    this.host = null;
    this.handleEvent = null;
    this.styleEl?.remove();
    this.styleEl = null;
  }

  private injectStyles(): void {
    if (document.querySelector('style[data-ripple-styles]')) return;

    this.styleEl = document.createElement('style');
    this.styleEl.setAttribute('data-ripple-styles', '');
    this.styleEl.textContent = rippleStyles;
    document.head.appendChild(this.styleEl);
  }
}

customElements.define('astro-ripple', AstroRipple);
