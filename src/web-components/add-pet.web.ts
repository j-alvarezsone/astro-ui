import type { MutationController } from '@utils/query';
import type { CreatePetBody, CreatePetResponse } from '../share/types/pet-contact';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import { invalidateQuery, useMutationQuery } from '@utils/query';
import { postNewPet } from '../share/queries/pets';

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
  #mutation: MutationController<CreatePetResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useMutationQuery<CreatePetResponse>({
      queryKey: ['pets', 'add'],
      queryFn: async () => {
        const payload = SAMPLE_PETS[sampleIndex % SAMPLE_PETS.length];
        sampleIndex += 1;
        return postNewPet(payload);
      },
      autoExecute: false,
      onSuccess: () => {
        invalidateQuery(['pets']);
      },
    });

    const mutation = this.#mutation;
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#unsubscribe = mutation.subscribe(() => {
      const button = this.#resolveButton();
      if (button) {
        applyButtonLoadingState(button, mutation.isPending || mutation.isFetching);
      }
    });

    this.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest('.button')) return;
        this.#addPet();
      },
      { signal },
    );
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#mutation?.cancel();
    this.#mutation = null;
    this.#controller?.abort();
    this.#controller = null;
  }

  #addPet(): void {
    if (!this.#mutation) return;
    if (this.#mutation.isPending || this.#mutation.isFetching) return;
    void this.#mutation.mutate();
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.button');
  }
}

if (!customElements.get('add-pet')) {
  customElements.define('add-pet', AddPetElement);
}
