---
title: Button Reference
summary: 'Complete Button theming map with practical usage: pt sections, style keys, tokens, classes, and troubleshooting.'
order: 5
updatedAt: 2026-05-01
---

## Purpose

Use this page when you need full Button theming details in one place:

- `pt` section support
- supported style config keys
- CSS custom properties
- runtime CSS classes you can target

## Quick Mental Model

Think of Button theming as 3 layers:

1. **Theme config layer** (`uiThemes.ts`)
   - Set style keys under `components.button`.
   - These keys generate `--button-*` CSS custom properties applied to every Button that adopts the theme.

2. **Token defaults layer** (`button.css`)
   - Defaults live in `:root` as `--button-*` variables.
   - Theme config overrides only values that differ for a named theme.

3. **Instance override layer** (`pt`)
   - Use `pt.<section>.class`, `pt.<section>.style`, and arbitrary attributes for one-off per-instance overrides on any individual part (`root`, `icon`, `label`, `loader`).
   - Prefer token overrides for production theming and native CSS properties for local exceptions.

## Source Of Truth

- `src/components/Button.astro`
- `src/share/types/theme/button.ts`
- `src/share/utils/theme/buttonConfig.ts`
- `src/share/utils/theme/passThrough.ts`
- `src/assets/css/theme/button.css`

Practical alignment notes:

- Runtime token consumption happens in `src/components/Button.astro`.
- Default token values come from `src/assets/css/theme/button.css`.
- Keep generator output names and consumed token names aligned when refactoring.

## Button `pt` Sections

`Button` supports these `pt` sections:

- `root`
- `icon`
- `label`
- `loader`

**Every section** accepts the same set of pass-through attributes:

- `class` (string or array of strings)
- `style` (string or object)
- arbitrary HTML attributes (`data-*`, `aria-*`, `id`, etc.)

The examples below focus on `root` as the most common target, but the same patterns apply to any section — swap `root` for `icon`, `label`, or `loader` to target that specific part instead.

### Example A: `pt.class` + `<style>` tag override

This snippet is an example pattern (not runtime source-of-truth):

```astro
<Button
  label="Save"
  pt={{
    root: { class: ['btn-save', 'btn-save--active', 'btn-save--brand'] },
    label: { class: 'btn-save__label' },
  }}
/>

<style>
  /* Base role class — scope hook for descendant selectors */
  :global(.btn-save) {
    --button-primary-background-color: var(--color-primary-fill);
    --button-primary-border-color: var(--color-primary-border);
  }

  /* State/variant modifier class */
  :global(.btn-save--active) {
    --button-primary-background-color: var(--color-primary-fill-hover);
  }

  /* Accent/modifier class */
  :global(.btn-save--brand) {
    --button-primary-color: var(--color-primary-on-fill);
  }

  /* Native property override with higher specificity */
  :global(.button.btn-save.btn-save--active) {
    letter-spacing: 0.04em;
  }

  /* Label descendant target via scope hook */
  :global(.btn-save .btn-save__label) {
    font-weight: 700;
  }
</style>
```

Button note:

- `pt.root.class` is the scope hook for the outermost element (the `<button>` or `<a>` tag). Use it for descendant selectors targeting inner parts.
- Use `pt.label.class`, `pt.icon.class`, and `pt.loader.class` for precise per-part overrides without needing descendant selectors.
- For general class-array layering strategy, see `theme-system-overview.md` -> `Pass-Through Class Strategy`.

### Example B: `pt.style` (inline style string/object)

```astro
<Button
  label="Object style"
  pt={{
    root: {
      style: {
        backgroundColor: 'orange',
      },
    },
    label: {
      style: {
        fontWeight: 700,
      },
    },
  }}
/>

<Button
  label="Token inline"
  pt={{
    root: {
      style: '--button-primary-background-color: var(--color-warning-fill); letter-spacing: 0.02em;',
    },
    loader: {
      style: 'opacity: 0.72;',
    },
  }}
/>
```

### Example C: arbitrary attributes (`data-*`, `aria-*`, `id`)

```astro
<Button
  label="Submit"
  icon={{ name: 'mdi:check' }}
  pt={{
    root: {
      id: 'submit-btn',
      'data-ui': 'submit-button',
      'data-action': 'submit',
      'aria-describedby': 'submit-help',
    },
    icon: {
      'data-ui': 'submit-button-icon',
    },
    label: {
      'data-ui': 'submit-button-label',
    },
  }}
/>

<style>
  /* Native CSS property override via id */
  :global(#submit-btn) {
    border-width: 2px;
  }

  /* Token-based override via id (recommended) */
  :global(#submit-btn) {
    --button-primary-background-color: var(--color-success-fill);
    --button-primary-color: var(--color-success-on-fill);
  }

  /* Token override via data attribute selector */
  :global([data-ui='submit-button']) {
    --button-primary-border-color: var(--color-success-border);
  }

  :global([data-ui='submit-button-icon']) {
    color: var(--color-success-on-fill);
  }

  :global([data-ui='submit-button-label']) {
    font-weight: 600;
  }
</style>
```

### What Is Possible

Both approaches are supported:

- Native CSS properties (for example `border-width`, `letter-spacing`)
- Component token variables (for example `--button-primary-background-color`)

For production theming, prefer token overrides. Use native CSS properties for local one-off exceptions.

## Button Style Config Keys

`button` style config is split across sub-configs per slot.

### Component-only keys

```ts
button: {
  root?: {
    gap?: string,
    borderWidth?: string,
    borderRadius?: string,
    roundedBorderRadius?: string,
    smPaddingBlock?: string,
    smPaddingInline?: string,
    mdPaddingBlock?: string,
    mdPaddingInline?: string,
    lgPaddingBlock?: string,
    lgPaddingInline?: string,
    primaryBackgroundColor?: string,
    primaryColor?: string,
    primaryBorderColor?: string,
    primaryHoverBackgroundColor?: string,
    secondaryBackgroundColor?: string,
    secondaryColor?: string,
    secondaryBorderColor?: string,
    secondaryHoverBackgroundColor?: string,
    contrastBackgroundColor?: string,
    contrastColor?: string,
    contrastBorderColor?: string,
    contrastHoverBackgroundColor?: string,
    successBackgroundColor?: string,
    successColor?: string,
    successBorderColor?: string,
    successHoverBackgroundColor?: string,
    warningBackgroundColor?: string,
    warningColor?: string,
    warningBorderColor?: string,
    warningHoverBackgroundColor?: string,
    dangerBackgroundColor?: string,
    dangerColor?: string,
    dangerBorderColor?: string,
    dangerHoverBackgroundColor?: string,
    disabledBackgroundColor?: string,
    disabledColor?: string,
    disabledBorderColor?: string,
    linkDisabledColor?: string,
    linkDisabledOpacity?: string,
    focusRingWidth?: string,
    primaryFocusRingColor?: string,
    secondaryFocusRingColor?: string,
    contrastFocusRingColor?: string,
    successFocusRingColor?: string,
    warningFocusRingColor?: string,
    dangerFocusRingColor?: string,
  },
  icon?: {
    color?: string,
  },
  label?: {
    smFontSize?: string,
    mdFontSize?: string,
    lgFontSize?: string,
    loadingOpacity?: string,
  },
  loader?: {
    color?: string,
  },
}
```

Example:

```ts
warm: {
  components: {
    button: {
      root: {
        primaryBackgroundColor: '#fb923c',
        primaryColor: '#ffffff',
        primaryBorderColor: '#ea580c',
        primaryHoverBackgroundColor: '#f97316',
        borderRadius: '0.5rem',
      },
      label: {
        mdFontSize: '0.9375rem',
      },
    },
  },
}
```

Why this split matters:

- `root` keys control layout, spacing, border, variant colors, disabled state, and focus ring — everything on the outermost element.
- `icon` keys target the icon element color independently from label text.
- `label` keys control per-size font sizes and the loading opacity of the label span.
- `loader` keys control the color of the spinner shown during loading state.

## CSS Custom Properties

### Button component tokens

```css
:root {
  /* Layout */
  --button-gap: var(--spacing-2);
  --button-border-width: var(--spacing-0-25);
  --button-border-radius: var(--rounded-lg);
  --button-rounded-border-radius: var(--rounded-full);

  /* Size: small */
  --button-sm-padding-block: var(--spacing-1-5);
  --button-sm-padding-inline: var(--spacing-2-5);

  /* Size: medium */
  --button-md-padding-block: var(--spacing-2);
  --button-md-padding-inline: var(--spacing-3);

  /* Size: large */
  --button-lg-padding-block: var(--spacing-2-5);
  --button-lg-padding-inline: var(--spacing-3-5);

  /* Primary variant */
  --button-primary-background-color: var(--color-primary-fill);
  --button-primary-color: var(--color-primary-on-fill);
  --button-primary-border-color: var(--color-primary-border);
  --button-primary-hover-background-color: var(--color-primary-fill-hover);
  --button-primary-focus-ring-color: var(--color-primary-focus-ring);

  /* Secondary variant */
  --button-secondary-background-color: var(--color-secondary-fill);
  --button-secondary-color: var(--color-secondary-on-fill);
  --button-secondary-border-color: var(--color-secondary-border);
  --button-secondary-hover-background-color: var(--color-secondary-fill-hover);
  --button-secondary-focus-ring-color: var(--color-secondary-focus-ring);

  /* Contrast variant */
  --button-contrast-background-color: var(--color-contrast-fill);
  --button-contrast-color: var(--color-contrast-on-fill);
  --button-contrast-border-color: var(--color-contrast-border);
  --button-contrast-hover-background-color: var(--color-contrast-fill-hover);
  --button-contrast-focus-ring-color: var(--color-contrast-focus-ring);

  /* Success variant */
  --button-success-background-color: var(--color-success-fill);
  --button-success-color: var(--color-success-on-fill);
  --button-success-border-color: var(--color-success-border);
  --button-success-hover-background-color: var(--color-success-fill-hover);
  --button-success-focus-ring-color: var(--color-success-focus-ring);

  /* Warning variant */
  --button-warning-background-color: var(--color-warning-fill);
  --button-warning-color: var(--color-warning-on-fill);
  --button-warning-border-color: var(--color-warning-border);
  --button-warning-hover-background-color: var(--color-warning-fill-hover);
  --button-warning-focus-ring-color: var(--color-warning-focus-ring);

  /* Danger variant */
  --button-danger-background-color: var(--color-danger-fill);
  --button-danger-color: var(--color-danger-on-fill);
  --button-danger-border-color: var(--color-danger-border);
  --button-danger-hover-background-color: var(--color-danger-fill-hover);
  --button-danger-focus-ring-color: var(--color-danger-focus-ring);

  /* Disabled state */
  --button-disabled-background-color: var(--color-disabled-fill);
  --button-disabled-color: var(--color-fg-disabled);
  --button-disabled-border-color: var(--color-disabled-border);
  --button-link-disabled-color: var(--color-fg-disabled);
  --button-link-disabled-opacity: 0.8;

  /* Focus ring */
  --button-focus-ring-width: var(--spacing-0-5);

  /* Icon */
  --button-icon-color: currentColor;

  /* Label font sizes */
  --button-label-sm-font-size: var(--font-size-sm);
  --button-label-md-font-size: var(--font-size-base);
  --button-label-lg-font-size: var(--font-size-lg);
  --button-label-loading-opacity: 0;

  /* Loader */
  --button-loader-color: currentColor;
}
```

## Troubleshooting

1. **Wrong target element** — Check which `pt` section matches the element you want to style. `root` targets the `<button>`/`<a>`, not the label or icon.
2. **Specificity too low** — A single class may not beat existing styles. Combine with `.button` (e.g., `:global(.button.my-class)`) or use an `id` override for maximum specificity.
3. **Astro style scoping** — Styles in `.astro` files are scoped by default. Always wrap selectors in `:global(...)` when targeting `pt` classes from a parent component's `<style>` block.
4. **Token not wiring** — Confirm the token is declared in `src/assets/css/theme/button.css` and consumed in `src/components/Button.astro`. Generator key names must match the CSS property names.

## Runtime CSS Classes

The following CSS classes are rendered by `Button` at runtime. Use `:global(...)` when targeting them from `pt` styles or Astro `<style>` blocks.

| Class                     | Element             | Notes                                 |
| ------------------------- | ------------------- | ------------------------------------- |
| `.button`                 | root (`button` tag) | Always present on button elements     |
| `.button--primary`        | root                | Variant modifier                      |
| `.button--secondary`      | root                | Variant modifier                      |
| `.button--contrast`       | root                | Variant modifier                      |
| `.button--success`        | root                | Variant modifier                      |
| `.button--warning`        | root                | Variant modifier                      |
| `.button--danger`         | root                | Variant modifier                      |
| `.button--sm`             | root                | Size modifier                         |
| `.button--md`             | root                | Size modifier                         |
| `.button--lg`             | root                | Size modifier                         |
| `.button--rounded`        | root                | Added when `rounded=true`             |
| `.button--disabled`       | root                | Added when `disabled` or `isLoading`  |
| `.button--icon-only`      | root                | Added when `icon` is set and no label |
| `.button__link`           | root (`a` tag)      | Always present on link elements       |
| `.button__link--sm`       | root                | Link size modifier                    |
| `.button__link--md`       | root                | Link size modifier                    |
| `.button__link--lg`       | root                | Link size modifier                    |
| `.button__link--disabled` | root                | Link disabled state                   |
| `.button__icon`           | icon element        | Always present when icon is rendered  |
| `.button__icon--right`    | icon element        | Added when `iconPos="right"`          |
| `.button__label`          | label span          | Always present                        |
| `.button__label--sm`      | label span          | Label size modifier                   |
| `.button__label--md`      | label span          | Label size modifier                   |
| `.button__label--lg`      | label span          | Label size modifier                   |
| `.button__label--loading` | label span          | Added when `isLoading=true`           |
| `.button__loader`         | loader span         | Present only when `isLoading=true`    |

Quick-reference style snippet:

```css
/* Token override on the root element */
:global(.button) {
  --button-primary-background-color: var(--color-primary-fill);
}

/* Token override on the label */
:global(.button__label) {
  --button-label-md-font-size: var(--font-size-base);
}
```
