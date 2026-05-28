import type { CreateUserBody, CreateUserResponse } from '../share/types/user-contact';
import { navigate } from 'astro:transitions/client';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { MutationController } from '@utils/query';
import { useMutationQuery } from '@utils/query';
import { createUserOptions } from '@queries/users';

interface SampleUserTemplate {
  name: string;
  emailPrefix: string;
}

const SAMPLE_USERS: SampleUserTemplate[] = [
  { name: 'Alice Foster', emailPrefix: 'alice.foster' },
  { name: 'Ben Harlow', emailPrefix: 'ben.harlow' },
  { name: 'Cara Moss', emailPrefix: 'cara.moss' },
  { name: 'Diego Reyes', emailPrefix: 'diego.reyes' },
  { name: 'Eve Barton', emailPrefix: 'eve.barton' },
];

/**
 * Build a unique email value for demo API writes.
 *
 * GoREST requires unique emails, so each click appends a timestamp/random
 * suffix to avoid duplicate-address 422 errors.
 *
 * @param emailPrefix - The local-part prefix from the selected sample user.
 * @returns A unique email string safe for repeated test writes.
 * @example
 * const email = buildUniqueEmail('alice.foster');
 */
function buildUniqueEmail(emailPrefix: string): string {
  const uniqueToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return `${emailPrefix}+${uniqueToken}@example.com`;
}

/**
 * Pick a random sample user payload with a unique email for the add-user demo.
 *
 * @returns A random sample user from the predefined demo list with unique email.
 * @example
 * const payload = pickRandomSampleUser();
 */
function pickRandomSampleUser(): CreateUserBody {
  const index = Math.floor(Math.random() * SAMPLE_USERS.length);
  const sample = SAMPLE_USERS[index];

  return {
    name: sample.name,
    email: buildUniqueEmail(sample.emailPrefix),
  };
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
