import type { CreateUserBody, CreateUserResponse } from '../share/types/user-contact';
import { navigate } from 'astro:transitions/client';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { MutationController } from '@utils/query';
import { useMutationQuery } from '@utils/query';
import { createUserOptions } from '@queries/users';

const SAMPLE_USERS: CreateUserBody[] = [
  { name: 'Alice Foster', email: 'alice.foster@example.com' },
  { name: 'Ben Harlow', email: 'ben.harlow@example.com' },
  { name: 'Cara Moss', email: 'cara.moss@example.com' },
  { name: 'Diego Reyes', email: 'diego.reyes@example.com' },
  { name: 'Eve Barton', email: 'eve.barton@example.com' },
];

/**
 * Pick a random sample user payload for the add-user demo.
 *
 * @returns A random sample user from the predefined demo list.
 * @example
 * const payload = pickRandomSampleUser();
 */
function pickRandomSampleUser(): CreateUserBody {
  const index = Math.floor(Math.random() * SAMPLE_USERS.length);

  return SAMPLE_USERS[index];
}

class AddUserElement extends HTMLElement {
  #controller: AbortController | null = null;
  #mutation: MutationController<CreateUserResponse, CreateUserBody> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useMutationQuery({
      ...createUserOptions,
      onSuccess: async () => {
        await navigate(window.location.href);
      },
    });

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
        this.#handleClick(event);
      },
      { signal },
    );
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#mutation = null;
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * Start the add-user flow when the wrapped button is clicked.
   *
   * @param event - Click event dispatched from the custom element subtree.
   * @returns Nothing.
   * @example
   * this.#handleClick(new MouseEvent('click'));
   */
  #handleClick(event: Event): void {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('.button')) return;

    this.#addUser().catch((error: unknown) => {
      console.error(error);
    });
  }

  async #addUser(): Promise<void> {
    if (!this.#mutation) return;
    if (this.#mutation.isPending) return;

    const payload = pickRandomSampleUser();
    await this.#mutation.mutate(payload);
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.button');
  }
}

if (!customElements.get('add-user')) {
  customElements.define('add-user', AddUserElement);
}
