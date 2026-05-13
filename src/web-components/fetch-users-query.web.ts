import { useClientQuery } from '@utils/query';
import type { ClientQueryController } from '@utils/query';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { GetAllUserResponse } from '../share/api/user-contact';
import { getAllUser } from '../share/queries/users';

const BUTTON_SELECTOR = '.button';

class FetchUsersQueryElement extends HTMLElement {
  #controller: AbortController | null = null;
  #query: ClientQueryController<GetAllUserResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#query = useClientQuery({
      queryKey: ['users'],
      autoExecute: false,
      queryFn: getAllUser,
      staleTime: 2000,
      onSuccess() {
        // Query executed successfully.
      },
    });

    this.#unsubscribe = this.#query.subscribe(() => {
      this.#render();
    });

    this.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        const button = this.#resolveButton();

        if (!(target instanceof Element)) {
          return;
        }

        if (!button || !target.closest(BUTTON_SELECTOR) || !button.contains(target)) {
          return;
        }

        void this.#runFetch();
      },
      { signal },
    );

    this.#render();
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#query?.cancel();
    this.#query = null;
  }

  async #runFetch(): Promise<void> {
    if (!this.#query || this.#query.isFetching || this.#query.isPending) {
      return;
    }

    await this.#query.execute();
  }

  #render(): void {
    if (!this.#query) {
      return;
    }

    const isPending = this.#query.isPending || this.#query.isFetching;
    const button = this.#resolveButton();

    if (button) {
      applyButtonLoadingState(button, isPending);
    }
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>(BUTTON_SELECTOR);
  }
}

if (!customElements.get('fetch-users-query')) {
  customElements.define('fetch-users-query', FetchUsersQueryElement);
}
