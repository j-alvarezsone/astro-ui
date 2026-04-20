---
title: InputText Reference
summary: 'Complete InputText theming map with practical usage: pt sections, style keys, tokens, classes, and troubleshooting.'
order: 2
updatedAt: 2026-04-19
---

## Purpose

Use this page when you need full InputText theming details in one place:

- all `pt` sections
- all supported style config keys
- all relevant CSS custom properties
- all runtime CSS classes you can target

## Quick Mental Model

Think of InputText theming as 3 layers:

1. Theme config layer (`uiThemes.ts`)
- Set style keys under `components.inputText`.
- Shared shell keys (`wrapper`, `label`, etc.) map to InputField shell tokens.
- Input-specific keys (`input.*`) map to input-control tokens.

2. Token defaults layer (`input-field.css` + `base-input.css`)
- Defaults live in CSS variables.
- Theme config overrides only what should differ.

3. Instance override layer (`pt`)
- Use `pt.class`, `pt.style`, and attributes for one-off usage overrides.
- Prefer token overrides for production theming and direct native CSS properties for local exceptions.

## Source Of Truth

- `src/components/form/InputText.astro`
- `src/components/form/InputField.astro`
- `src/components/form/InputLabel.astro`
- `src/share/types/theme/form/inputText.ts`
- `src/share/types/theme/form/inputField.ts`
- `src/share/utils/theme/form/inputTextConfig.ts`
- `src/share/utils/theme/form/inputFieldConfig.ts`
- `src/assets/css/theme/base-input.css`
- `src/assets/css/theme/input-field.css`

Practical alignment notes:

- Runtime token consumption happens in `src/components/form/InputField.astro`.
- Default token values come from `src/assets/css/theme/base-input.css` and `src/assets/css/theme/input-field.css`.
- Keep generator output names and consumed token names aligned when refactoring.

## InputText `pt` Sections

`InputText` supports these `pt` sections:

- `root`
- `wrapper`
- `input`
- `label`
- `icon`
- `helpText`
- `errorText`

Each section accepts pass-through attributes:

- `class` (string or array of strings)
- `style` (string or object)
- arbitrary HTML attributes (`data-*`, `aria-*`, `id`, etc.)

### Example A: `pt.class` + `<style>` tag override

This snippet is an example pattern (not runtime source-of-truth):

```astro
<InputText
  name="email"
  label="Email"
  placeholder="name@example.com"
  pt={{
    root: { class: 'email-field-root' },
    wrapper: { class: ['email-shell', 'email-shell--compact', 'email-shell--info'] },
    input: { class: 'email-input' },
    helpText: { class: 'email-help' },
    errorText: { class: 'email-error' },
  }}
/>

<style>
  /* Root-level scope class:
     useful to scope all nested field styling in one area. */
  :global(.email-field-root .input-field__wrapper) {
    --input-field-wrapper-focus-ring-color: var(--color-link-border);
  }

  /* Wrapper base class (1 responsibility) */
  :global(.email-shell) {
    --input-field-wrapper-background: var(--color-primary-subtle);
    --input-field-wrapper-border-color: var(--color-primary-border);
  }

  /* Wrapper modifier class (2nd responsibility) */
  :global(.email-shell--compact) {
    --input-field-wrapper-padding-inline: var(--spacing-2);
  }

  /* Wrapper state/variant class (3rd responsibility) */
  :global(.email-shell--info) {
    --input-field-wrapper-border-color: var(--color-link-border);
  }

  /* Native CSS property override via class:
     use higher specificity than .input-field__wrapper to win cascade. */
  :global(.input-field__wrapper.email-shell.email-shell--info) {
    background-color: blue;
    border-color: blue;
  }

  /* Input class has its own separate responsibility */
  :global(.email-input) {
    --input-control-input-color: var(--color-fg);
  }
</style>
```

InputText note:

- `root.class` is mainly a scope hook for descendant selectors.
- Wrapper visual overrides should target the wrapper element itself (`.input-field__wrapper...`) or override wrapper tokens.

For general pass-through specificity and class-array layering guidance, see `theme-system-overview.md` -> `Pass-Through Class Strategy`.

### Example B: `pt.style` (inline style string/object)

```astro
<InputText
  name="email"
  label="Email"
  placeholder="name@example.com"
  pt={{
    wrapper: { style: { backgroundColor: 'orange' } },
    input: {
      style: '--input-control-input-color: var(--color-warning-fg); letter-spacing: 0.02em;',
    },
  }}
/>
```

### Example C: arbitrary attributes (`data-*`, `aria-*`, `id`)

```astro
<InputText
  name="email"
  label="Email"
  placeholder="name@example.com"
  pt={{
    wrapper: { id: 'email-wrapper', 'data-ui': 'email-wrapper', 'aria-live': 'polite' },
    input: { id: 'email-input', 'data-ui': 'email-input', 'aria-label': 'Email address' },
    label: { id: 'email-label', 'data-ui': 'email-label' },
    helpText: { id: 'email-help', 'data-ui': 'email-help' },
    errorText: { id: 'email-error', 'data-ui': 'email-error' },
  }}
/>

<style>
  /* Native CSS property override via id:
     id specificity is high, so this usually wins directly. */
  :global(#email-wrapper) {
    background-color: blue;
    border-color: blue;
  }

  /* Token-based override (recommended for theming) */
  :global(#email-wrapper) {
    --input-field-wrapper-background: var(--color-secondary-subtle);
    --input-field-wrapper-border-color: var(--color-secondary-border);
  }

  :global([data-ui='email-label']) {
    --input-field-label-active-color: var(--color-secondary-fg);
  }

  :global(#email-help) {
    color: var(--color-fg-muted);
  }
</style>
```

### What Is Possible

Both approaches are supported:

- Native CSS properties (for example `background-color`, `border-color`)
- Component token variables (for example `--input-field-wrapper-background`)

In InputText docs, prefer token overrides for production theming and use direct native properties for local one-off overrides.

## InputText Style Config Keys

`inputText` style config combines shared `InputField` shell keys with InputText-only keys.

Current object shape in named themes:

- Shared shell keys stay at the top level of `inputText` (`root`, `wrapper`, `label`, `icon`, `helpText`, `errorText`).
- Input control keys stay under `inputText.input`.

### Shared shell keys (`InputFieldStyleConfig`)

```ts
inputText: {
  root: {
    gap: string,
  },
  wrapper: {
    gap: string,
    backgroundColor: string,
    borderColor: string,
    hoverBorderColor: string,
    focusBorderColor: string,
    focusRingColor: string,
    errorBorderColor: string,
    disabledBackgroundColor: string,
    borderRadius: string,
    paddingInline: string,
  },
  label: {
    color: string,
    defaultColor: string,
    activeColor: string,
    backgroundColor: string,
    requiredColor: string,
    optionalColor: string,
  },
  icon: {
    color: string,
    disabledOpacity: string | number,
  },
  helpText: {
    color: string,
  },
  errorText: {
    color: string,
  },
}
```

### InputText-only keys

```ts
inputText: {
  input: {
    color: string,
    paddingBlock: string,
    placeholderColor: string,
    placeholderErrorColor: string,
    disabledColor: string,
  },
}
```

Example:

```ts
warm: {
  components: {
    inputText: {
      wrapper: {
        backgroundColor: '#fff7ed',
        borderColor: '#fdba74',
        hoverBorderColor: '#fb923c',
        focusBorderColor: '#ea580c',
        focusRingColor: '#fb923c',
      },
      label: {
        activeColor: '#9a3412',
      },
      input: {
        placeholderColor: '#9a3412',
      },
    },
  },
}
```

Why this split matters:

- `wrapper`/`label`/... are consumed by shared shell styling.
- `input.*` is consumed by the native `<input>` styling path.

## CSS Custom Properties

### Base input control tokens

```css
:root {
  --input-control-input-color: var(--color-fg);
  --input-control-input-padding-block: var(--spacing-2-5);
  --input-control-input-placeholder-color: var(--color-fg-muted);
  --input-control-input-placeholder-error-color: var(--color-danger-fg);
  --input-control-input-disabled-color: var(--color-fg-disabled);
}
```

### Shared shell tokens used by InputText

```css
:root {
  --input-field-root-gap: var(--spacing-1-5);
  --input-field-wrapper-gap: var(--spacing-2);
  --input-field-wrapper-background: var(--color-surface);
  --input-field-wrapper-border-color: var(--color-border);
  --input-field-wrapper-hover-border-color: var(--color-hover-border);
  --input-field-wrapper-focus-border-color: var(--color-focus-border);
  --input-field-wrapper-focus-ring-color: var(--color-focus-ring);
  --input-field-wrapper-error-border-color: var(--color-danger-border);
  --input-field-wrapper-disabled-background: var(--color-disabled-fill);
  --input-field-wrapper-border-radius: var(--rounded-lg);
  --input-field-wrapper-padding-inline: var(--spacing-3-5);
  --input-field-label-color: var(--color-fg-muted);
  --input-field-label-default-color: var(--color-fg);
  --input-field-label-active-color: var(--color-fg);
  --input-field-label-background: var(--color-surface);
  --input-field-label-required-color: var(--color-danger-fg);
  --input-field-label-optional-color: var(--color-fg-muted);
  --input-field-icon-color: currentColor;
  --input-field-icon-disabled-opacity: 0.4;
  --input-field-help-color: var(--color-fg-muted);
  --input-field-error-color: var(--color-danger-fg);
}
```

## Troubleshooting

If your override does not apply as expected:

1. Check target element choice.
- Wrapper visuals should target wrapper selectors or wrapper tokens.
- Text/placeholder visuals should target input-control tokens.

2. Check selector specificity.
- A single custom class can tie with component-class specificity.
- Use a combined selector (or an `id`) for direct native property overrides.

3. Check Astro style scoping.
- Use `:global(...)` when targeting runtime classes emitted by the component.

4. Check token wiring.
- Defaults: `src/assets/css/theme/base-input.css`, `src/assets/css/theme/input-field.css`.
- Runtime consumption: `src/components/form/InputField.astro`.

## Runtime CSS Classes

Main classes rendered by InputText/InputField/InputLabel:

- `.input-field`
- `.input-field__wrapper`
- `.input-field__wrapper--error`
- `.input-field__wrapper--default`
- `.input-field__wrapper--over`
- `.input-field__wrapper--in`
- `.input-field__wrapper--on`
- `.input-field__wrapper--sm`
- `.input-field__wrapper--md`
- `.input-field__wrapper--lg`
- `.input-field__icon`
- `.input-field__icon--left`
- `.input-field__icon--right`
- `.input-field__help`
- `.input-field__error`
- `.input-label`
- `.input-label--default`
- `.input-label--over`
- `.input-label--in`
- `.input-label--on`

When using `pt.class`, remember Astro styles are scoped by default.
To target runtime classes from `pt`, use `:global(...)`.

```astro
<style>
  :global(.field-shell-custom) {
    --input-field-wrapper-focus-ring-color: #22d3ee;
  }

  :global(.price-input) {
    --input-control-input-color: #0f172a;
  }
</style>
```
