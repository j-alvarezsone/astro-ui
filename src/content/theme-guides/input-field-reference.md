---
title: InputField Reference
summary: 'InputField is the shared field shell — label, border wrapper, icon, help and error text — that all text-like controls build on top of.'
order: 3
updatedAt: 2026-04-30
---

## Purpose

**InputField is a shell component, not an input control.**

It provides the visual structure that surrounds a form control:

- the field label (`InputLabel`)
- the bordered wrapper that holds the control and optional icon
- help text below the wrapper
- error text below the wrapper

The actual control — `<input>`, `<select>`, `<textarea>`, or a custom element — is passed in via `<slot />`. InputField never renders an input element itself.

### Who uses InputField

Every text-like component in this library wraps InputField internally:

- **InputText** — adds a standard `<input type="text|number">` into the slot
- InputEmail, InputPassword, Textarea, Select _(planned)_

You typically do **not** use InputField directly unless you are building a new input-type component that needs the same shell (label + wrapper + help/error).

### InputField vs InputText at a glance

|                            | InputField                  | InputText                    |
| -------------------------- | --------------------------- | ---------------------------- |
| Renders the label          | ✓                           | ✓ via InputField             |
| Renders the border wrapper | ✓                           | ✓ via InputField             |
| Renders the `<input>`      | ✗ — you slot it in          | ✓                            |
| Has `pt.input` slot        | ✗                           | ✓                            |
| Use when                   | Building a new control type | Using a text input in a form |

## Quick Mental Model

InputField theming works in 3 layers:

1. **Theme config layer** (`uiThemes.ts`)
   - Set shared shell keys under `components.inputText` (or your custom component key).
   - These map to `--input-field-*` CSS variables via `inputFieldConfig.ts`.

2. **Token defaults layer** (`input-field.css`)
   - Every `--input-field-*` variable has a default referencing a design token.
   - You only override what should differ from the token.

3. **Instance override layer** (`pt`)
   - Use `pt.root`, `pt.wrapper`, `pt.label`, `pt.icon`, `pt.helpText`, `pt.errorText` for one-off visual adjustments.
   - `pt` accepts `class`, `style`, and any HTML attribute on the target element.

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
    focusRingWidth: string,
    errorBorderColor: string,
    invalidRingColor: string,
    validBorderColor: string,
    validRingColor: string,
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
  --input-field-wrapper-focus-ring-width: var(--spacing-0-5);
  --input-field-wrapper-error-border-color: var(--color-danger-border);
  --input-field-wrapper-invalid-ring-color: var(--color-danger-subtle);
  --input-field-wrapper-valid-border-color: var(--color-success-border);
  --input-field-wrapper-valid-ring-color: var(--color-success-subtle);
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
    --input-field-wrapper-focus-ring-width: var(--spacing-1);
    --input-field-wrapper-invalid-ring-color: #f5d0fe;
    --input-field-wrapper-valid-border-color: #a3e635;
    --input-field-wrapper-valid-ring-color: #ecfccb;
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
