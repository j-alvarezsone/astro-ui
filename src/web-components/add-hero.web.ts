import type { CreateHeroBody, CreateHeroResponse, GetAllHeroesResponse } from '../share/types/hero-contact';
import { navigate } from 'astro:transitions/client';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { MutationController } from '@utils/query';
import { useMutationQuery } from '@utils/query';
import { createHeroOptions, resetHeroesOptions } from '@queries/heroes';

interface SampleHeroTemplate {
  name: string;
  power: string;
}

const SAMPLE_HEROES: SampleHeroTemplate[] = [
  { name: 'Rogue', power: 'Power absorption' },
  { name: 'Wolverine', power: 'Regeneration' },
  { name: 'Iceman', power: 'Cryokinesis' },
  { name: 'Magik', power: 'Portal stepping' },
  { name: 'Colossus', power: 'Organic steel form' },
];

/**
 * Build a unique hero name value for demo API writes.
 *
 * @param name - Base hero name from the selected sample hero.
 * @returns A unique hero name string for repeated test writes.
 * @example
 * const uniqueName = buildUniqueHeroName('Rogue');
 */
function buildUniqueHeroName(name: string): string {
  const uniqueToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return `${name} ${uniqueToken}`;
}

/**
 * Pick a random sample hero payload for the add-hero demo.
 *
 * @returns A random sample hero from the predefined demo list.
 * @example
 * const payload = pickRandomSampleHero();
 */
function pickRandomSampleHero(): CreateHeroBody {
  const index = Math.floor(Math.random() * SAMPLE_HEROES.length);
  const sample = SAMPLE_HEROES[index];

  return {
    name: buildUniqueHeroName(sample.name),
    power: sample.power,
  };
}

class AddHeroElement extends HTMLElement {
  #controller: AbortController | null = null;
  #createMutation: MutationController<CreateHeroResponse, CreateHeroBody> | null = null;
  #resetMutation: MutationController<GetAllHeroesResponse, void> | null = null;
  #createUnsubscribe: (() => void) | null = null;
  #resetUnsubscribe: (() => void) | null = null;
  #isNavigating = false;

  connectedCallback(): void {
    const createMutation = useMutationQuery({
      ...createHeroOptions,
    });
    const resetMutation = useMutationQuery({
      ...resetHeroesOptions,
    });

    this.#createMutation = createMutation;
    this.#resetMutation = resetMutation;
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.#createUnsubscribe = createMutation.subscribe(() => {
      const button = this.#resolveActionButton('add');
      if (!button) return;

      applyButtonLoadingState(button, createMutation.isPending || this.#isNavigating);
    });

    this.#resetUnsubscribe = resetMutation.subscribe(() => {
      const button = this.#resolveActionButton('reset');
      if (!button) return;

      applyButtonLoadingState(button, resetMutation.isPending || this.#isNavigating);
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
    this.#createUnsubscribe?.();
    this.#createUnsubscribe = null;
    this.#resetUnsubscribe?.();
    this.#resetUnsubscribe = null;
    this.#createMutation = null;
    this.#resetMutation = null;
    this.#controller?.abort();
    this.#controller = null;
  }

  /**
   * Start the add-hero flow when the wrapped button is clicked.
   *
   * @param event - Click event dispatched from the custom element subtree.
   * @returns Nothing.
   * @example
   * this.#handleClick(new MouseEvent('click'));
   */
  #handleClick(event: Event): void {
    if (!(event.target instanceof Element)) return;
    const actionHost = event.target.closest<HTMLElement>('[data-hero-action]');
    if (!actionHost) return;
    if (!event.target.closest('.button')) return;

    const action = actionHost.dataset.heroAction;

    const runAction = action === 'reset' ? this.#resetHeroes() : this.#addHero();

    runAction.catch((error: unknown) => {
      console.error(error);
    });
  }

  /**
   * Adds one random demo hero through the configured mutation.
   *
   * @returns A promise that resolves after the mutation finishes.
   * @example
   * await this.#addHero();
   */
  async #addHero(): Promise<void> {
    if (!this.#createMutation) return;
    if (this.#createMutation.isPending) return;
    if (this.#resetMutation?.isPending) return;
    if (this.#isNavigating) return;

    const payload = pickRandomSampleHero();
    await this.#createMutation.mutate(payload);
    await this.#navigateWithRefreshParam();
  }

  /**
   * Resets heroes data through the reset API endpoint.
   *
   * @returns A promise that resolves once reset and navigation complete.
   * @example
   * await this.#resetHeroes();
   */
  async #resetHeroes(): Promise<void> {
    if (!this.#resetMutation) return;
    if (this.#resetMutation.isPending) return;
    if (this.#createMutation?.isPending) return;
    if (this.#isNavigating) return;

    await this.#resetMutation.mutate();
    await this.#navigateWithRefreshParam();
  }

  /**
   * Navigate to the current page with a unique refresh query key to force a cache-key miss.
   *
   * @returns A promise that resolves when navigation completes.
   * @example
   * await this.#navigateWithRefreshParam();
   */
  async #navigateWithRefreshParam(): Promise<void> {
    if (this.#isNavigating) return;

    this.#isNavigating = true;
    this.#syncLoadingState();

    try {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('__refresh', String(Date.now()));
      await navigate(nextUrl.toString());
    } finally {
      this.#isNavigating = false;
      this.#syncLoadingState();
    }
  }

  /**
   * Sync loading state for add/reset buttons based on mutation and navigation activity.
   *
   * @returns Nothing.
   * @example
   * this.#syncLoadingState();
   */
  #syncLoadingState(): void {
    const addButton = this.#resolveActionButton('add');
    if (addButton) {
      applyButtonLoadingState(addButton, Boolean(this.#createMutation?.isPending) || this.#isNavigating);
    }

    const resetButton = this.#resolveActionButton('reset');
    if (resetButton) {
      applyButtonLoadingState(resetButton, Boolean(this.#resetMutation?.isPending) || this.#isNavigating);
    }
  }

  #resolveActionButton(action: 'add' | 'reset'): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[data-hero-action="${action}"] .button`);
  }
}

if (!customElements.get('add-hero')) {
  customElements.define('add-hero', AddHeroElement);
}
