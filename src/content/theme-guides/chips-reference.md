---
title: Chips Reference
summary: 'Complete Chips theming map with practical usage: pt section, style keys, tokens, classes, and troubleshooting.'
order: 4
updatedAt: 2026-04-24
---

## Purpose

Use this page when you need full Chips theming details in one place:

- `pt` section support
- supported style config keys
- CSS custom properties
- runtime CSS classes you can target

## Quick Mental Model

Think of Chips theming as 3 layers:

1. Theme config layer (`uiThemes.ts`)

- Set style keys under `components.chips`.
- These keys generate `--chips-*` CSS custom properties.

2. Token defaults layer (`chips.css`)

- Defaults live in `:root` as `--chips-*` variables.
- Theme config overrides only values that differ for a named theme.

3. Instance override layer (`pt`)

- Use `pt.root.class`, `pt.root.style`, and attributes for one-off per-instance overrides.
- Prefer token overrides for production theming and native CSS properties for local exceptions.

## Source Of Truth

- `src/components/misc/Chips.astro`
- `src/share/types/theme/misc/chips.ts`
- `src/share/types/theme/uiThemes.ts`
- `src/share/utils/theme/misc/chipsConfig.ts`
- `src/share/utils/theme/passThrough.ts`
- `src/share/utils/theme/uiThemes.ts`
- `src/assets/css/theme/chips.css`

Practical alignment notes:

- Runtime token consumption happens in `src/components/misc/Chips.astro`.
- Default token values come from `src/assets/css/theme/chips.css`.
- Keep generator output names and consumed token names aligned when refactoring.

## Chips `pt` Sections

`Chips` currently supports these `pt` sections:

- `root`
- `image`
- `icon`
- `label`
- `removeIcon`

The `root` section accepts pass-through attributes:

- `class` (string or array of strings)
- `style` (string or object)
- arbitrary HTML attributes (`data-*`, `aria-*`, `id`, etc.)

### Example A: `pt.class` + `<style>` tag override

This snippet is an example pattern (not runtime source-of-truth):

```astro
<Chips
  label="Warm"
  pt={{
    root: { class: ['chips-filter', 'chips-filter--active', 'chips-filter--brand'] },
  }}
/>

<style>
  /* Base role class */
  :global(.chips-filter) {
    --chips-background-color: var(--color-primary-subtle);
    --chips-border-color: var(--color-primary-border);
  }

  /* State/variant class */
  :global(.chips-filter--active) {
    --chips-active-background-color: var(--color-primary-fg);
    --chips-active-color: var(--color-surface);
  }

  /* Accent/modifier class */
  :global(.chips-filter--brand) {
    --chips-color: var(--color-link-fg);
  }

  /* Native property override with higher specificity */
  :global(.chips.chips-filter.chips-filter--active) {
    border-width: 2px;
  }
</style>
```

Chips note:

- `pt.root.class` remains the broad scope hook for the root button.
- Use slot-level sections (`image`, `icon`, `label`, `removeIcon`) for precise per-part overrides.
- For general class-array layering strategy, see `theme-system-overview.md` -> `Pass-Through Class Strategy`.

### Example B: `pt.style` (inline style string/object)

```astro
<Chips
  label="Inline Styled"
  pt={{
    label: {
      style: {
        fontWeight: 600,
      },
    },
    root: {
      style: {
        backgroundColor: 'orange',
      },
    },
  }}
/>

<Chips
  label="Token Inline"
  removeIcon={{ name: 'mdi:close-circle-outline' }}
  pt={{
    removeIcon: {
      style: 'opacity: 0.72;',
    },
    root: {
      style: '--chips-active-background-color: var(--color-warning-fg); letter-spacing: 0.02em;',
    },
  }}
/>
```

### Example C: arbitrary attributes (`data-*`, `aria-*`, `id`)

```astro
<Chips
  label="Filter"
  icon={{ name: 'mdi:microsoft-windows' }}
  removeIcon={{ name: 'mdi:close-circle-outline' }}
  pt={{
    root: {
      id: 'chips-filter-button',
      'data-ui': 'chips-filter-button',
      'data-group': 'status',
      'aria-label': 'Filter by status',
      'aria-pressed': 'false',
    },
    icon: {
      'data-ui': 'chips-filter-icon',
    },
    removeIcon: {
      'data-ui': 'chips-remove-icon',
      'aria-hidden': 'true',
    },
  }}
/>

<style>
  /* Native CSS property override via id */
  :global(#chips-filter-button) {
    border-color: blue;
  }

  /* Token-based override via id (recommended) */
  :global(#chips-filter-button) {
    --chips-background-color: var(--color-secondary-subtle);
    --chips-color: var(--color-secondary-fg);
  }

  /* Token override via data attribute selector */
  :global([data-ui='chips-filter-button']) {
    --chips-active-border-color: var(--color-secondary-border);
  }

  :global([data-ui='chips-filter-icon']) {
    color: var(--color-secondary-fg);
  }

  :global([data-ui='chips-remove-icon']) {
    opacity: 0.85;
  }
</style>
```

### What Is Possible

Both approaches are supported:

- Native CSS properties (for example `border-color`, `letter-spacing`)
- Component token variables (for example `--chips-background-color`)

For production theming, prefer token overrides. Use native CSS properties for local one-off exceptions.

## Chips Style Config Keys

`chips` style config uses component-only keys.

### Shared keys

None currently. Chips does not consume shared InputField shell keys.

### Component-only keys

```ts
chips: {
  backgroundColor: string,
  borderColor: string,
  color: string,
  activeBackgroundColor: string,
  activeBorderColor: string,
  activeColor: string,
}
```

Example:

```ts
warm: {
  components: {
    chips: {
      backgroundColor: '#fff7ed',
      borderColor: '#fdba74',
      color: '#9a3412',
      activeBackgroundColor: '#fb923c',
      activeBorderColor: '#ea580c',
      activeColor: '#ffffff',
    },
  },
}
```

Why this split matters:

- Chips has no shared shell layer in the current implementation.
- All Chips theming is consumed directly by `src/components/misc/Chips.astro` via `--chips-*` tokens.

## CSS Custom Properties

### Chips component tokens

```css
:root {
  --chips-background-color: var(--color-contrast-subtle);
  --chips-border-color: var(--color-border);
  --chips-color: var(--color-contrast-fg);
  --chips-active-background-color: var(--color-primary-subtle);
  --chips-active-border-color: var(--color-primary-fg);
  --chips-active-color: var(--color-primary-fg);
}
```

## Troubleshooting

If your override does not apply as expected:

1. Check target element choice.

- Chips renders one root button. Target that element via `pt.root` hooks.

2. Check selector specificity.

- Use combined selectors (for example `.chips.custom-class.state-class`) when native properties are being overridden by component rules.

3. Check Astro style scoping.

- Use `:global(...)` for `pt` classes and attributes from component instances.

4. Check token wiring.

- Confirm `src/share/utils/theme/misc/chipsConfig.ts` outputs the same `--chips-*` names consumed in `src/components/misc/Chips.astro` and defaulted in `src/assets/css/theme/chips.css`.

## Runtime CSS Classes

Chips runtime classes:

- `.chips`
- `.chips--sm`
- `.chips--md`
- `.chips--lg`
- `.chips--with-image`
- `.chips__icon`
- `.chips__icon--left`
- `.chips__icon--right`
- `.chips__image`
- `.chips__label`
- `.chips__remove-icon`

Use `:global(...)` when targeting these from docs or page-level `<style>` blocks, because Astro styles are scoped by default.

Quick reference example (complete usage):

```astro
<Chips
  label="Status"
  data-active
  pt={{
    root: { class: 'quick-chip' },
  }}
/>

<style>
  :global(.chips.quick-chip) {
    --chips-background-color: var(--color-primary-subtle);
  }

  :global(.chips.quick-chip[data-active]) {
    --chips-active-background-color: var(--color-primary-fg);
  }
</style>
```

Why this exists:

- `.chips.quick-chip` targets the same root button and overrides its default token value.
- `[data-active]` targets the active-state branch used by `Chips.astro` and sets a different active token.
- `:global(...)` is required because the `quick-chip` class is injected at runtime via `pt.root.class`.
