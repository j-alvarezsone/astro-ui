import type { ClientQueryController } from '@utils/query';
import { useClientQuery } from '@utils/query';
import { getAllUsersOptions } from '../share/queries/users';
import type { GetAllUserResponse, UserContact } from '../share/types/user-contact';

class FetchUsersQueryElement extends HTMLElement {
  #query: ClientQueryController<GetAllUserResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#query = useClientQuery(getAllUsersOptions);

    this.#unsubscribe = this.#query.subscribe(() => {
      this.#render();
    });

    this.#render();
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#query?.cancel();
    this.#query = null;
  }

  #render(): void {
    if (!this.#query) {
      return;
    }

    const loader = this.querySelector<HTMLElement>('[data-users-loader]');
    const list = this.querySelector<HTMLElement>('[data-users-list]');
    const error = this.querySelector<HTMLElement>('[data-users-error]');

    const isLoading = this.#query.isPending || this.#query.isFetching;

    if (loader) {
      loader.hidden = !isLoading;
    }

    if (error) {
      error.hidden = !this.#query.isError;
      if (this.#query.isError) {
        const message = this.#query.error instanceof Error
          ? this.#query.error.message
          : 'Failed to load users.';
        error.textContent = message;
      } else {
        error.textContent = '';
      }
    }

    if (!list) {
      return;
    }

    const users = this.#query.data?.items ?? [];
    list.replaceChildren(...users.map((user) => this.#createListItem(user)));
    list.hidden = users.length === 0;
  }

  #createListItem(user: UserContact): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'query-demo__item';
    item.textContent = user.name;

    return item;
  }
}

if (!customElements.get('fetch-users-query')) {
  customElements.define('fetch-users-query', FetchUsersQueryElement);
}
