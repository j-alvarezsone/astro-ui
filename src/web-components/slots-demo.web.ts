class SlotsDemoElement extends HTMLElement {
  #controller: AbortController | null = null;

  connectedCallback(): void {
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    const preview = this.querySelector<HTMLElement>('[data-slots-preview]');

    if (!preview) return;

    this.querySelectorAll<HTMLElement>('[data-slots-item]').forEach((item) => {
      const selector = item.dataset.slotsItem;
      if (!selector) return;

      const targets = Array.from(preview.querySelectorAll<HTMLElement>(selector));
      if (targets.length === 0) return;

      item.addEventListener('mouseenter', () => this.#activate(item, targets), { signal });
      item.addEventListener('mouseleave', () => this.#deactivate(item, targets), { signal });
      item.addEventListener('focus', () => this.#activate(item, targets), { signal });
      item.addEventListener('blur', () => this.#deactivate(item, targets), { signal });
    });
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  #activate(item: HTMLElement, targets: HTMLElement[]): void {
    item.setAttribute('data-slots-active', '');
    targets.forEach((t) => t.setAttribute('data-slots-highlight', ''));
  }

  #deactivate(item: HTMLElement, targets: HTMLElement[]): void {
    item.removeAttribute('data-slots-active');
    targets.forEach((t) => t.removeAttribute('data-slots-highlight'));
  }
}

customElements.define('slots-demo', SlotsDemoElement);
