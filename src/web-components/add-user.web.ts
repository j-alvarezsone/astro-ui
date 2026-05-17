import type { CreateUserBody, CreateUserResponse } from '../share/types/user-contact';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { ClientQueryController } from '@utils/query';
import { invalidateQuery, useClientQuery } from '@utils/query';
import { postNewUser } from '../share/queries/users';

const SAMPLE_USERS: CreateUserBody[] = [
  { name: 'Alice Foster', email: 'alice.foster@example.com' },
  { name: 'Ben Harlow', email: 'ben.harlow@example.com' },
  { name: 'Cara Moss', email: 'cara.moss@example.com' },
  { name: 'Diego Reyes', email: 'diego.reyes@example.com' },
  { name: 'Eve Barton', email: 'eve.barton@example.com' },
];

let sampleIndex = 0;

class AddUserElement extends HTMLElement {
  #controller: AbortController | null = null;
  #mutation: ClientQueryController<CreateUserResponse> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useClientQuery({
      queryKey: ['users', 'add'],
      queryFn: async () => {
        const payload = SAMPLE_USERS[sampleIndex % SAMPLE_USERS.length];
        sampleIndex += 1;
        return postNewUser(payload);
      },
      autoExecute: false,
      onSuccess: () => {
        invalidateQuery(['users']);
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
        this.#addUser();
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

  #addUser(): void {
    if (!this.#mutation) return;
    if (this.#mutation.isPending || this.#mutation.isFetching) return;
    void this.#mutation.execute();
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.button');
  }
}

if (!customElements.get('add-user')) {
  customElements.define('add-user', AddUserElement);
}
