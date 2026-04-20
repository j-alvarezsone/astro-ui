---
title: Theme System Overview
summary: How themes are authored, resolved, and extended in this Astro UI project.
order: 1
updatedAt: 2026-04-19
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

## Adding A New Theme Name

1. Add a new top-level entry in `src/share/utils/theme/uiThemes.ts`.
2. Override only values that should differ from defaults.
3. Keep object shape typed via `satisfies Record<string, UIThemeConfig>`.

## Create A Theme Globally

To create a theme globally (available project-wide), define it in the shared theme registry:

```ts
import type { UIThemeConfig } from '@/types/theme/uiThemes';

const UI_THEMES = {
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
  },
} as const satisfies Record<string, UIThemeConfig>;
```

Where to put it:

- Add or update this in `src/share/utils/theme/uiThemes.ts`.

How it becomes global:

1. Register theme values in `UI_THEMES`.
2. Pass `uiTheme="warm"` to `Layout.astro` on any page.
3. The layout injects generated CSS variables for all supported components on that page.

Use this for page-wide theming, not one-off component tweaks.

## How To Use In A Page

Use the global theme by passing `uiTheme` to the layout:

```astro
---
import Layout from '@layouts/Layout.astro';
---

<Layout uiTheme="warm">
  <!-- themed components go here -->
</Layout>
```

That applies the selected theme to all registered themed components rendered inside the page.

## Component-Level Theme Override

Each themed component can be configured under its key inside `components`. Override only the values that should differ from defaults.

## When To Use Each Layer

- Use `uiTheme` for page-wide or product-wide theme changes.
- Use `components.<componentKey>` in `UI_THEMES` for component-level defaults in a named theme.
- Use `pt` for one-off instance overrides (class/style/attributes) in a specific usage.

## Pass-Through Class Strategy

Use this strategy when styling component instances with `pt.class`.

How class arrays should work:

- `wrapper.class` can be an array of multiple classes.
- Each class should have one clear role (base, modifier, state).
- Keep selectors separate for each class; avoid one giant mixed selector for everything.
- Add one high-specificity combined selector only when you need a native direct property override.

Why `root.class` exists:

- `root.class` is a scope hook. By itself, it does not automatically change wrapper visuals.
- Use `root.class` to scope descendant selectors without ids, for example:
  - `:global(.email-field-root .input-field__wrapper) { ... }`
  - `:global(.email-field-root .input-label) { ... }`

When wrapper visuals should target wrapper directly:

- For direct visual properties (`background-color`, `border-color`), target the wrapper element itself:
  - `:global(.input-field__wrapper.email-shell.email-shell--info) { ... }`

In short:

- `root.class` = scoping and grouping multiple field selectors
- `.input-field__wrapper...` = direct wrapper visual override

## Adding A New Themed Component

1. Create a dedicated component type file under `src/share/types/theme/...`.
2. Register it in `UIThemeComponentsConfig`.
3. Add a style-var generator under `src/share/utils/theme/...`.
4. Add default CSS variables under `src/assets/css/theme/...`.
5. Include the generator in `createComponentThemeCss.ts`.
6. Update component CSS to consume the generated variables.
7. Add docs examples for how the new component should be themed and overridden.
