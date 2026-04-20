---
title: InputField Reference
summary: 'Complete InputField shared-shell reference: config keys, CSS tokens, and class hooks.'
order: 3
updatedAt: 2026-04-19
---

## Purpose

Use this page to understand the shared field shell used by text-like controls:

- InputText
- InputEmail
- InputPassword
- Textarea
- Select

## Source Of Truth

- `src/components/form/InputField.astro`
- `src/components/form/InputLabel.astro`
- `src/share/types/theme/form/inputField.ts`
- `src/share/utils/theme/form/inputFieldConfig.ts`
- `src/assets/css/theme/input-field.css`

## InputField Style Config Keys

`InputField` style keys define shared shell behavior:

```ts
inputField: {
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

In named themes, these are typically nested under `components.inputText` today, because InputText consumes the shared shell.

## CSS Custom Properties (Shared Shell)

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

Example class-based override:

```astro
<style>
  :global(.billing-field-shell) {
    --input-field-wrapper-border-color: #7c3aed;
    --input-field-wrapper-focus-ring-color: #c4b5fd;
  }
</style>
```

## Relationship To Base Input Control Tokens

InputField controls shell styling.
Text-like controls use shared input-control tokens such as:

- `--input-control-input-color`
- `--input-control-input-padding-block`
- `--input-control-input-placeholder-color`
- `--input-control-input-placeholder-error-color`
- `--input-control-input-disabled-color`

For those keys and full `pt` section mapping, see `/theme-system/input-text`.
