class CompRefsFilter extends HTMLElement {
  #filter: HTMLInputElement | null = null;
  #catBtns: NodeListOf<HTMLButtonElement> | null = null;
  #rows: NodeListOf<HTMLLIElement> | null = null;
  #groups: NodeListOf<HTMLElement> | null = null;
  #empty: HTMLElement | null = null;
  #countEl: HTMLElement | null = null;
  #activeCat = '';
  #controller: AbortController | null = null;

  connectedCallback(): void {
    this.#filter = this.querySelector<HTMLInputElement>('[data-filter]');
    this.#catBtns = this.querySelectorAll<HTMLButtonElement>('[data-cat-btn]');
    this.#rows = this.querySelectorAll<HTMLLIElement>('[data-row]');
    this.#groups = this.querySelectorAll<HTMLElement>('[data-group]');
    this.#empty = this.querySelector<HTMLElement>('[data-empty]');
    this.#countEl = this.querySelector<HTMLElement>('[data-count]');

    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#filter?.addEventListener('input', () => this.#applyFilter(), { signal });

    this.#catBtns?.forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          this.#activeCat = btn.dataset.catBtn ?? '';
          this.#catBtns?.forEach((b) =>
            b.toggleAttribute('data-active', b === btn),
          );
          this.#applyFilter();
        },
        { signal },
      );
    });
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  #applyFilter(): void {
    const query = this.#filter?.value.trim().toLowerCase() ?? '';
    let visible = 0;

    this.#rows?.forEach((row) => {
      const matchLabel = row.dataset.label?.includes(query) ?? true;
      const matchCat = this.#activeCat === '' || row.dataset.rowCat === this.#activeCat;
      const show = matchLabel && matchCat;
      row.hidden = !show;
      if (show) visible++;
    });

    this.#groups?.forEach((group) => {
      const anyVisible = [...group.querySelectorAll<HTMLLIElement>('[data-row]')].some(
        (r) => !r.hidden,
      );
      group.hidden = !anyVisible;
    });

    if (this.#empty) this.#empty.hidden = visible > 0;

    if (this.#countEl) {
      const total = this.#rows?.length ?? 0;
      this.#countEl.textContent =
        query || this.#activeCat
          ? `${visible} of ${total} component${total === 1 ? '' : 's'}`
          : `${total} component${total === 1 ? '' : 's'}`;
    }
  }
}

customElements.define('comp-refs-filter', CompRefsFilter);
