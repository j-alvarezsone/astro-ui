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

## Pass-Through (`pt`) Pattern

Components that accept a `pt` prop for per-slot attribute injection **must** follow this exact pattern. Never deviate.

### 1. Type the pass-through interface in `src/share/types/theme/`

Each slot has a `PassThroughAttributes` entry:

```ts
import type { PassThroughAttributes } from '@/types/theme/form/shared';

export interface MyComponentPassThrough {
  root?: PassThroughAttributes;
  // add one key per distinct DOM slot
}
```

### 2. In the component frontmatter, split with `splitPassThroughAttributes`

Always import and use the shared utility — never write an IIFE, a custom spread, or `as string | undefined` casts:

```astro
import { splitPassThroughAttributes } from '@utils/theme/form/inputTextConfig';
import type { MyComponentPassThrough } from '@/types/theme/my-component';

const { pt, ...rest } = Astro.props;
const { className: rootClass, attributes: rootAttributes } = splitPassThroughAttributes(pt?.root);
```

### 3. In the template, bind class and attributes separately

```astro
<div
  class:list={['my-component', rootClass]}
  {...rootAttributes}
  {...rest}
/>
```

`splitPassThroughAttributes` returns `{ className, attributes }` where `attributes` already excludes `class` and is `undefined` when empty — so spreading it is always safe.

### Rules

- **Never** manually destructure `{ class: _, style: __, ...attrs }` inline.
- **Never** use an IIFE `(() => { ... })()` inside the template to strip keys.
- **Never** cast `pt?.root?.style as string | undefined`.
- **Always** use `splitPassThroughAttributes` from `@utils/theme/form/inputTextConfig`.
- Keep `class:list` for classes and `{...rootAttributes}` for everything else, in that order.
- Place `{...rest}` after `{...rootAttributes}` so component-level props do not override pass-through.

## Theming Decision

When creating a new reusable UI component, especially a form-related or stateful visual primitive, ask whether it should participate in the theme system before implementing its styling API.

Default requirement:
- any new reusable component should be designed to support theming
- if user confirms, implement full theme support in the same task
- if user postpones, keep CSS and API theme-ready so future enablement is straightforward

Ask this especially for:
- text-like form controls
- reusable field shells
- components with borders, labels, icons, backgrounds, or interactive state colors

If the component should be themeable:
- follow `.github/instructions/theme-system.instructions.md`
- keep shared shell styling separate from component-specific styling
- add or update tests for the theme behavior
- run `pnpm run type:check`

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

Use `connectedCallback` / `disconnectedCallback` for lifecycle and always clean up side effects.

### Event listener cleanup with `AbortController`

Use a private `AbortController` field (initialised to `null`) to manage all event listeners. Pass its `signal` to every `addEventListener` call. Abort and nullify in `disconnectedCallback` — this removes all registered listeners in one call, with no manual `removeEventListener` needed.

```ts
class MyElement extends HTMLElement {
  #controller: AbortController | null = null;

  connectedCallback(): void {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener('click', this.#handleClick, { signal });
    window.addEventListener('resize', this.#handleResize, { signal });
    // Add as many listeners as needed — all cleaned up by a single abort().
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  #handleClick = (e: MouseEvent): void => {
    // handler logic
  };

  #handleResize = (): void => {
    // handler logic
  };
}

customElements.define('ui-my-element', MyElement);
```

Key rules:
- Always type the field as `AbortController | null` and initialise to `null`.
- Create a **new** `AbortController` in `connectedCallback` (the element may reconnect after disconnecting).
- Destructure `signal` immediately and pass it to every `addEventListener` — never store `signal` separately.
- In `disconnectedCallback`: call `abort()` then set the field back to `null`.
- Never call `removeEventListener` manually when using this pattern — `abort()` handles it.
- File naming: `*.web.ts` (enforced by the project structure).
- Use `observedAttributes` and `attributeChangedCallback` for reactive attributes.
- Register with a descriptive, hyphenated custom element name that reflects the component's purpose (e.g., `form-control`, `ripple-button`). The name must contain at least one hyphen (HTML spec requirement). Do not use framework names (`astro-*`, `vue-*`) or generic prefixes (`ui-*`) as namespaces.

## CSS / Design Token Conventions

> **Token enforcement rule:** Follow the canonical rule in `AGENTS.md` (`Conventions` → `CSS token enforcement`). Never invent token names. If a token is missing from `src/assets/css/tokens.css`, ask the user first and only proceed after explicit confirmation and after adding the token to `tokens.css`.

- Use design tokens (CSS custom properties from `src/assets/css/tokens.css`) for all colors, spacing, and typography values.
- Follow BEM naming for component class names (`.block__element--modifier`).
- Use CSS logical properties (`margin-inline`, `padding-block`) for writing-mode compatibility.
- Prefer CSS custom properties for theming over hard-coded values.
- Keep component styles scoped; reach for `:global` only for utility or reset styles.

### Pass-Through Styling And Selector Specificity

When components expose pass-through sections (`pt`) for `class`, `style`, and arbitrary attributes:

- Treat `root.class` as a **scope hook** for descendant selectors. It does not change child visuals by itself.
- For direct visual overrides (`background-color`, `border-color`, etc.), target the actual internal element (`.input-field__wrapper`, `.button`, etc.).
- A single custom class often has equal specificity to internal component classes; if both set the same property, final result depends on cascade order.
- To make direct property overrides reliable, increase specificity (for example `.input-field__wrapper.my-class`) or use an `id` selector.
- Prefer component CSS variable overrides (`--component-*`) for production theming. They are more stable across refactors and state variants.

Recommended class-array pattern:

- Use class arrays as layered roles, not mixed responsibilities:
  - base class (`component-shell`)
  - modifier class (`component-shell--compact`)
  - state/variant class (`is-warning`)
- Keep selectors separate per role; only add a combined high-specificity selector when needed for a native direct property override.

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
| `border-color` on hover for enabled elements | `--color-hover-border` |
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
