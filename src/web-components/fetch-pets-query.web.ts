import type { ClientQueryController } from '@utils/query';
import type { GetAllPetsResponse, PetContact } from '../share/types/pet-contact';
import { useClientQuery } from '@utils/query';
import { getAllPetsOptions } from '../share/queries/pets';

class FetchPetsQueryElement extends HTMLElement {
  #query: ClientQueryController<GetAllPetsResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#query = useClientQuery(getAllPetsOptions);

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

    const loader = this.querySelector<HTMLElement>('[data-pets-loader]');
    const list = this.querySelector<HTMLElement>('[data-pets-list]');
    const error = this.querySelector<HTMLElement>('[data-pets-error]');

    const isLoading = this.#query.isPending || this.#query.isFetching;

    if (loader) {
      loader.hidden = !isLoading;
    }

    if (error) {
      error.hidden = !this.#query.isError;
      if (this.#query.isError) {
        const message = this.#query.error instanceof Error
          ? this.#query.error.message
          : 'Failed to load pets.';
        error.textContent = message;
      } else {
        error.textContent = '';
      }
    }

    if (!list) {
      return;
    }

    const pets = this.#query.data?.items ?? [];

    list.replaceChildren(...pets.map((pet) => this.#createListItem(pet)));
    list.hidden = pets.length === 0;
  }

  #createListItem(pet: PetContact): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'query-demo__item';
    item.textContent = `${pet.name} (${pet.type})`;

    return item;
  }
}

if (!customElements.get('fetch-pets-query')) {
  customElements.define('fetch-pets-query', FetchPetsQueryElement);
}
