---
title: Theme System Overview
summary: How themes are authored, resolved, and extended in this Astro UI project.
order: 1
updatedAt: 2026-04-17
---

## Goal

The theme system allows us to configure component-level styling in a typed object and transform it into runtime CSS custom properties.

This gives us:

- typed theme authoring in TypeScript
- sparse overrides per theme
- reusable component defaults in CSS
- centralized runtime generation in the layout

## Runtime Flow

1. A page passes `uiTheme` into `Layout.astro`.
2. `getComponentsThemeCss(themeName)` resolves and validates the theme.
3. Component style-var generators convert config into CSS declarations.
4. CSS custom properties are injected globally by the layout.
5. Components consume those properties through their CSS.

## Current Architecture

- `src/share/utils/theme/uiThemes.ts`: named theme config entries
- `src/share/types/theme/uiThemes.ts`: registered component config typing
- `src/share/utils/theme/createComponentThemeCss.ts`: composition of style-var generators
- `src/share/utils/theme/theme.ts`: runtime orchestration

### Shared Vs Specific Tokens

Keep shared field-shell behavior under `input-field` tokens and component-specific behavior under `input-text` tokens.

Examples:

- shared shell: wrapper border, focus ring, label and helper colors
- text-specific: input text color, placeholder color, input padding

## Adding A New Theme Name

1. Add a new top-level entry in `src/share/utils/theme/uiThemes.ts`.
2. Override only values that should differ from defaults.
3. Keep object shape typed through `defineUIThemes(...)`.

Example:

```ts
const UI_THEMES = defineUIThemes({
  warm: {
    components: {
      inputText: {
        wrapper: {
          backgroundColor: '#fff7ed',
          borderColor: '#fdba74',
        },
      },
    },
  },
});
```

## How To Use In A Page

Use the global theme by passing `uiTheme` to the layout:

```astro
---
import Layout from '@layouts/Layout.astro';
import InputText from '@components/form/InputText.astro';
---

<Layout uiTheme="warm">
  <InputText name="email" label="Email" placeholder="name@company.com" />
</Layout>
```

That applies the selected theme to all registered themed components rendered inside the page.

## Component-Level Theme Override

If you want to customize only one component type inside a theme, do it in `components.inputText`:

```ts
const UI_THEMES = defineUIThemes({
  warm: {
    components: {
      inputText: {
        wrapper: {
          backgroundColor: '#fff7ed',
          borderColor: '#fdba74',
          focusBorderColor: '#ea580c',
        },
        input: {
          placeholderColor: '#9a3412',
        },
      },
    },
  },
});
```

Use `wrapper`, `label`, `icon`, `helpText`, and `errorText` for shared shell styling.
Use `input` for text-control-specific styling.

## Per-Instance Override With pt

`InputText` supports `pt` (pass-through attributes) so you can override one instance without creating a new theme.

Supported sections:

- `root`
- `wrapper`
- `input`
- `label`
- `icon`
- `helpText`
- `errorText`

### Use classes with pt

```astro
<InputText
  name="price"
  label="Price"
  placeholder="0.00"
  pt={{
    root: { class: 'field-root-custom' },
    wrapper: { class: ['field-shell-custom', 'field-shell--compact'] },
    input: { class: 'price-input' },
    helpText: { class: 'price-help' },
  }}
/>
```

If you pass classes through `pt`, remember that Astro component styles are scoped by default.
To style those runtime classes, use `:global(...)` in your component `<style>` block.

```astro
<style>
  :global(.field-shell-custom) {
    --input-field-wrapper-focus-ring-color: #22d3ee;
  }

  :global(.price-input) {
    color: #0f172a;
  }
</style>
```

Where to find `--input-field-wrapper-focus-ring-color` in this project:

- Default token declaration: `src/assets/css/theme/input-field.css`
- Theme config mapping (`wrapper.focusRingColor` -> CSS variable): `src/share/utils/theme/form/inputFieldConfig.ts`
- Runtime usage on focus ring: `src/components/form/InputField.astro`

### Use styles with pt

Style values can be passed as either a string or an object.

#### String style example

You can pass regular CSS declarations as a single string, for example:

`background-color: #dcfce7; border-color: #22c55e;`

```astro
<InputText
  name="amount"
  label="Amount"
  placeholder="0.00"
  pt={{
    wrapper: {
      style: 'background-color: #dcfce7; border-color: #22c55e;',
    },
    input: {
      style: 'font-variant-numeric: tabular-nums; letter-spacing: 0.02em; color: #0f172a;',
    },
  }}
/>
```

#### Object style example

```astro
<InputText
  name="amount"
  label="Amount"
  placeholder="0.00"
  pt={{
    wrapper: {
      style: {
        '--input-field-wrapper-background': '#ecfeff',
        '--input-field-wrapper-border-color': '#06b6d4',
      },
    },
  }}
/>
```

## When To Use Each Layer

- Use `uiTheme` for page-wide or product-wide theme changes.
- Use `components.inputText` in `UI_THEMES` for component-level defaults in a named theme.
- Use `pt` for one-off instance overrides (class/style/attributes) in a specific usage.

## Adding A New Themed Component

1. Create a dedicated component type file under `src/share/types/theme/...`.
2. Register it in `UIThemeComponentsConfig`.
3. Add a style-var generator under `src/share/utils/theme/...`.
4. Add default CSS variables under `src/assets/css/theme/...`.
5. Include the generator in `createComponentThemeCss.ts`.
6. Update component CSS to consume the generated variables.
7. Add docs examples for how the new component should be themed and overridden.
