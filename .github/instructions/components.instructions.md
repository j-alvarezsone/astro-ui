---
applyTo: "src/components/**,src/web-components/**"
---

# Component Guidelines

## Astro Components

Prefer SSR-first. Accept a typed `Props` interface and use `class:list` for conditional classes:

```astro
---
interface Props {
  label: string;
  variant?: 'primary' | 'secondary';
  class?: string | string[];
}
const { label, variant = 'primary', class: className } = Astro.props;
---

<div class:list={['card', `card--${variant}`, className]}>
  <slot />
</div>

<style>
  .card { /* scoped styles */ }
  .card--primary { /* ... */ }
</style>
```

Key rules:
- Use `class:list` — never concatenate class strings manually.
- Expose a `class` prop to allow the parent to extend styles.
- Keep styles scoped (`<style>` block without `:global`).
- Default slot for content; named slots for distinct regions.

## Vue SFCs

Use `<script setup>` with the Composition API. Define all props and emits explicitly:

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>();
const emit = defineEmits<{ (e: 'change', value: number): void }>();

function increment() {
  emit('change', props.count + 1);
}
</script>

<template>
  <button type="button" @click="increment">{{ props.count }}</button>
</template>
```

Key rules:
- `defineProps`, `defineEmits` — no `Options API`.
- Use `computed`, `watch`, `ref`, `reactive` from `vue`.
- Use `toRefs` when destructuring reactive props.

## Web Components (`*.web.ts`)

Use `connectedCallback` / `disconnectedCallback` for lifecycle and always clean up side effects:

```ts
// src/web-components/ripple.web.ts
class RippleElement extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    this.addEventListener('click', this.#handleClick, {
      signal: this.#controller.signal,
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #handleClick = (e: MouseEvent) => {
    // side effect logic
  };
}

customElements.define('ui-ripple', RippleElement);
```

Key rules:
- File naming: `*.web.ts` (enforced by the project structure).
- Use private `AbortController` to clean up listeners.
- Use `observedAttributes` and `attributeChangedCallback` for reactive attributes.
- Register with a namespaced custom element name (e.g., `ui-*`).

## CSS / Design Token Conventions

- Use design tokens (CSS custom properties from `src/assets/css/tokens.css`) for all colors, spacing, and typography values.
- Follow BEM naming for component class names (`.block__element--modifier`).
- Use CSS logical properties (`margin-inline`, `padding-block`) for writing-mode compatibility.
- Prefer CSS custom properties for theming over hard-coded values.
- Keep component styles scoped; reach for `:global` only for utility or reset styles.

### Token Selection Guide

**Text and icons** — use global foreground tokens:

| Situation | Token |
|---|---|
| Primary text: headings, labels, body | `--color-fg` |
| Secondary / muted text: help text, subtext, placeholders | `--color-fg-muted` |
| Text inside a disabled element | `--color-fg-disabled` |
| Colored ink for a semantic role (e.g. danger label) | `--color-{role}-fg` |

**Backgrounds (surfaces)** — choose by emphasis:

| Situation | Token |
|---|---|
| Solid high-emphasis surface: buttons, active chips | `--color-{role}-fill` |
| Hover state of a solid surface | `--color-{role}-fill-hover` |
| Text / icon placed ON a solid surface | `--color-{role}-on-fill` |
| Low-emphasis tinted surface: alerts, badges, tags | `--color-{role}-subtle` |
| Hover state of a subtle surface | `--color-{role}-subtle-hover` |
| Text / icon placed ON a subtle surface | `--color-{role}-on-subtle` |
| Base neutral surface (inputs, cards, panels) | `--color-surface` |
| Disabled surface (not interactive) | `--color-disabled-fill` |

**Borders:**

| Situation | Token |
|---|---|
| Default neutral border | `--color-border` |
| Stronger neutral border (e.g. dividers) | `--color-border-strong` |
| Semantic border (e.g. danger input outline) | `--color-{role}-border` |
| Border on a disabled element | `--color-disabled-border` |

**Interaction states:**

| Situation | Token |
|---|---|
| `border-color` on a focused element | `--color-focus-border` |
| `outline` ring around a focused element | `--color-focus-ring` |

**Available roles:** `primary` · `secondary` · `contrast` · `link` · `success` · `warning` · `danger`

**Spacing:** `--spacing-{n}` (0 → 12, with 0.5-step variants like `--spacing-1-5`).
**Typography:** `--font-size-{xs|sm|base|lg|xl|2xl|3xl|4xl|5xl}` · `--font-weight-{light|normal|medium|semibold|bold}`.
**Border radius:** `--rounded-{none|xs|sm|md|lg|xl|2xl|3xl|4xl|full}`.

```css
/* Good */
.button {
  padding-inline: var(--spacing-4);
  background-color: var(--color-primary-fill);
}

/* Avoid */
.button {
  padding: 0 16px;
  background-color: #1a73e8;
}
```
