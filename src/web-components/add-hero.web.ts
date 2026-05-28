import type { CreateHeroBody, CreateHeroResponse } from '../share/types/hero-contact';
import { navigate } from 'astro:transitions/client';
import { applyButtonLoadingState } from '@utils/dom/applyButtonLoadingState';
import type { MutationController } from '@utils/query';
import { useMutationQuery } from '@utils/query';
import { createHeroOptions } from '@queries/heroes';

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
  #mutation: MutationController<CreateHeroResponse, CreateHeroBody> | null = null;
  #unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    this.#mutation = useMutationQuery({
      ...createHeroOptions,
      onSuccess: async () => {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('__refresh', String(Date.now()));
        await navigate(nextUrl.toString());
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
   * Start the add-hero flow when the wrapped button is clicked.
   *
   * @param event - Click event dispatched from the custom element subtree.
   * @returns Nothing.
   * @example
   * this.#handleClick(new MouseEvent('click'));
   */
  #handleClick(event: Event): void {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('.button')) return;

    this.#addHero().catch((error: unknown) => {
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
    if (!this.#mutation) return;
    if (this.#mutation.isPending) return;

    const payload = pickRandomSampleHero();
    await this.#mutation.mutate(payload);
  }

  #resolveButton(): HTMLElement | null {
    return this.querySelector<HTMLElement>('.button');
  }
}

if (!customElements.get('add-hero')) {
  customElements.define('add-hero', AddHeroElement);
}
