---
title: InputText Reference
summary: "Complete InputText theming map: pt sections, style config keys, CSS tokens, and runtime classes."
order: 2
updatedAt: 2026-04-19
---

## Purpose

Use this page when you need full InputText theming details in one place:

- all `pt` sections
- all supported style config keys
- all relevant CSS custom properties
- all runtime CSS classes you can target

## Source Of Truth

- `src/components/form/InputText.astro`
- `src/components/form/InputField.astro`
- `src/components/form/InputLabel.astro`
- `src/share/types/theme/form/inputText.ts`
- `src/share/types/theme/form/inputField.ts`
- `src/share/utils/theme/form/inputTextConfig.ts`
- `src/share/utils/theme/form/inputFieldConfig.ts`
- `src/assets/css/theme/input-text.css`
- `src/assets/css/theme/input-field.css`

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

Example:

```astro
<InputText
  name="price"
  label="Price"
  placeholder="0.00"
  pt={{
    root: { class: 'field-root-custom', 'data-testid': 'price-field' },
    wrapper: { class: ['field-shell-custom', 'field-shell--compact'] },
    input: { class: 'price-input', style: { letterSpacing: '0.02em' } },
    helpText: { class: 'price-help' },
    errorText: { class: 'price-error' },
  }}
/>
```

## InputText Style Config Keys

`inputText` style config combines shared `InputField` shell keys with InputText-only keys.

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

## CSS Custom Properties

### InputText-only tokens

```css
:root {
  --input-text-input-color: inherit;
  --input-text-input-padding-block: var(--spacing-2-5);
  --input-text-input-placeholder-color: var(--color-fg-muted);
  --input-text-input-placeholder-error-color: var(--color-danger-fg);
  --input-text-input-disabled-color: var(--color-fg-disabled);
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
    --input-text-input-color: #0f172a;
  }
</style>
```
