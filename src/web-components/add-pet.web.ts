import type { MutationController } from '@utils/query';
import type { CreatePetBody, CreatePetResponse } from '../share/types/pet-contact';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import { useMutationQuery } from '@utils/query';
import { createPetOptions } from '@queries/pets';

const SAMPLE_PETS: CreatePetBody[] = [
  { name: 'Buddy', type: 'dog' },
  { name: 'Whiskers', type: 'cat' },
  { name: 'Tweety', type: 'bird' },
  { name: 'Bella', type: 'dog' },
  { name: 'Shadow', type: 'cat' },
];

let sampleIndex = 0;

class AddPetElement extends HTMLElement {
  #controller: AbortController | null = null;
  #mutation: MutationController<CreatePetResponse, CreatePetBody> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useMutationQuery(createPetOptions);

    const mutation = this.#mutation;
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.#unsubscribe = mutation.subscribe(() => {
      const button = this.#resolveButton();
      if (button) {
        applyButtonLoadingState(button, mutation.isPending);
      }
    });

    this.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest('.button')) return;
        this.handleClick(event);
      },
      { signal },
    );
  }

  handleClick(event: Event): void {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('.button')) return;
    this.#addPet().catch((error: unknown) => {
      console.error(error);
    });
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#mutation = null;
    this.#controller?.abort();
    this.#controller = null;
  }

  async #addPet() {
    if (!this.#mutation) return;
    if (this.#mutation.isPending) return;
    const payload = SAMPLE_PETS[sampleIndex % SAMPLE_PETS.length];
    sampleIndex += 1;
    await this.#mutation.mutate(payload);
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.button');
  }
}

if (!customElements.get('add-pet')) {
  customElements.define('add-pet', AddPetElement);
}
