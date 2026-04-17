---
name: theme-system
description: Build, extend, and refactor the typed component theme system in this Astro UI project. Use when asked to add a new UI theme, create any theme-capable component, register a component in UIThemeComponentsConfig, split shared field-shell tokens from component-specific tokens, update CSS custom-property naming, wire new style-var generators into createComponentThemeCss, or verify theme behavior with tests and typecheck. Also use whenever creating a new reusable component to ensure it can support theming now or with minimal follow-up.
---

# Theme System

This skill governs the typed theme architecture used by the project.

It is for:

- adding new named themes
- adding new themed components
- making any new reusable component theme-capable
- refactoring theme token boundaries
- deciding whether a new component should be themeable
- preserving the shared `InputField` shell model
- ensuring theme changes are validated with tests and typecheck

## When to Use This Skill

Use this skill when the task mentions any of the following:

- theme system
- UI themes
- `UI_THEMES`
- `UIThemeComponentsConfig`
- CSS custom properties for components
- `input-field` vs `input-text`
- `createComponentThemeCss`
- `createThemeCssFromStyleVars`
- adding any new reusable component that should support theming
- renaming theme tokens
- extending theme types under `src/share/types/theme/**`
- updating files under `src/share/utils/theme/**`
- updating files under `src/assets/css/theme/**`

## Core Rules

### 1. Ask before theming a new component

When creating a new UI component that is visually reusable or form-related, ask this question before implementing the theme layer:

- "Do you want this new component to participate in the theme system?"

Default stance:

- if the component is reusable, design it to be theme-capable
- if the user says "yes", wire full theme support immediately
- if the user says "not now", keep architecture ready so enabling theme later is small and safe

Ask this especially for:

- text-like form controls
- reusable UI primitives
- components that have borders, labels, backgrounds, icons, or state colors

Do not ask this for obviously non-themeable one-off code unless the user is clearly building a reusable component library feature.

### 2. Always separate shared shell styling from component-specific styling

Use shared field-shell tokens for styling that belongs to the reusable `InputField` shell.

Use component-specific tokens only for behavior unique to the concrete control.

Examples:

- shared shell: wrapper border/background/focus/error, label colors, icon colors, help/error colors
- InputText-only: input text color, placeholder colors, disabled text color, text-control padding

### 3. Do not grow one catch-all type file

Keep theme types split by concern.

Current pattern:

- `src/share/types/theme/form/shared.ts`
- `src/share/types/theme/form/inputField.ts`
- `src/share/types/theme/form/inputText.ts`
- `src/share/types/theme/uiThemes.ts`

Future components should follow the same pattern with dedicated files.

### 4. Theme authoring must stay typed

Theme objects must stay authored through the typed `defineUIThemes(...)` pattern in `src/share/utils/theme/uiThemes.ts`.

Do not regress to broad untyped objects or `Record<string, unknown>` authoring.

### 5. Tests are mandatory for theme changes

Every change to the theme system must be verified.

Minimum requirements:

- run `pnpm run type:check`
- update or add tests for the changed theme behavior
- all relevant tests must pass
- changed theme-related logic must have 100% coverage in focused tests for the modified behavior

For theme utility changes, prefer focused tests under:

- `src/share/utils/theme/**/*.test.ts`

For behavior changes that affect generated CSS, add assertions for the exact CSS declarations or rule output.

Do not stop at implementation without verification.

## Current Source Of Truth

When making theme changes, align with these files:

- `src/share/utils/theme/uiThemes.ts`
- `src/share/types/theme/uiThemes.ts`
- `src/share/utils/theme/createComponentThemeCss.ts`
- `src/share/utils/theme/theme.ts`
- `src/share/utils/theme/form/inputFieldConfig.ts`
- `src/share/utils/theme/form/inputTextConfig.ts`
- `src/share/types/theme/form/inputField.ts`
- `src/share/types/theme/form/inputText.ts`
- `src/assets/css/theme/input-field.css`
- `src/assets/css/theme/input-text.css`
- `.github/instructions/theme-system.instructions.md`

## Naming Rules

### Shared field shell tokens

Use `--input-field-*` for:

- root spacing
- wrapper tokens
- label tokens
- icon tokens
- help text tokens
- error text tokens

### InputText-only tokens

Use `--input-text-*` for:

- input text color
- placeholder styling
- disabled text styling
- input-specific spacing

### New component-specific namespaces

Use the narrowest correct namespace for component-specific tokens.

Examples:

- `--select-*`
- `--textarea-*`
- `--input-password-*`

Do not put shared shell styling under a component-specific namespace.

## Workflow: Add a New Theme Name

1. Open `src/share/utils/theme/uiThemes.ts`.
2. Add a new top-level theme entry using the existing typed shape.
3. Only override values that differ from defaults.
4. Keep the config sparse and intention-driven.
5. Run `pnpm run type:check`.
6. Add or update tests if the change affects generated CSS or theme resolution behavior.

Example shape:

```ts
cool: {
  components: {
    inputText: {
      wrapper: {
        backgroundColor: '#eff6ff',
        borderColor: '#60a5fa',
        focusBorderColor: '#2563eb',
        focusRingColor: '#93c5fd',
      },
      input: {
        placeholderColor: '#1d4ed8',
      },
    },
  },
}
```

## Workflow: Add a New Themed Component

1. Ask whether the new component should participate in the theme system.
2. Decide whether it reuses `InputField` or needs its own structure.
3. Create a dedicated type file under `src/share/types/theme/...`.
4. Register the component in `src/share/types/theme/uiThemes.ts`.
5. Create a style-var generator under `src/share/utils/theme/...`.
6. Add default CSS variable values under `src/assets/css/theme/...` if new tokens are introduced.
7. Wire the generator into `src/share/utils/theme/createComponentThemeCss.ts` if it contributes runtime theme CSS.
8. Use the variables in the component CSS.
9. Add or update tests.
10. Run `pnpm run type:check`.

## Workflow: Make Any New Reusable Component Theme-Capable

Apply this workflow whenever a new reusable component is created.

1. Ask whether the user wants theme support implemented now.
2. Design the component API so styling is controlled by CSS custom properties, not hardcoded values.
3. Define component theme types in a dedicated file under `src/share/types/theme/...`.
4. Register the component in `UIThemeComponentsConfig` if it should be theme-addressable.
5. Create a style-var generator under `src/share/utils/theme/...`.
6. Add defaults in `src/assets/css/theme/...`.
7. Add generator wiring in `src/share/utils/theme/createComponentThemeCss.ts`.
8. Add tests that verify generated CSS declarations and runtime theme output.
9. Run `pnpm run type:check` and relevant tests.

## Workflow: Decide Whether to Reuse InputField

Reuse `InputField` for:

- InputText
- InputEmail
- InputPassword
- Textarea
- Select

Usually do not reuse `InputField` as-is for:

- checkbox
- radio

Reason: checkbox and radio have different structure, semantics, and interaction patterns.

## Workflow: Refactor Theme Boundaries

When token naming or config ownership feels wrong:

1. Identify whether the styling belongs to a shared shell or a concrete component.
2. Move shared behavior into a shared type/config/token namespace.
3. Keep control-specific styling narrow.
4. Update generators, defaults, and consuming CSS together.
5. Update tests for exact generated output.
6. Run `pnpm run type:check`.

## Testing Expectations

For theme-system work, validate the following where relevant:

- theme name resolution
- component registration and lookup
- style-var generation
- CSS rule generation
- merged output when multiple generators are composed
- absence of stale token names after refactors

Preferred validation tools:

- focused unit tests for theme utilities
- `pnpm run type:check`
- grep/search verification when renaming tokens across the system

For modified theme logic, ensure focused test coverage reaches 100% for the changed paths.

When the task changes generated CSS, assert the exact expected string where practical.

## What Not To Do

- Do not add new themed controls into one giant `form.ts` type file.
- Do not use `input-text-*` for shared field-shell styling.
- Do not add a component to `UI_THEMES` without updating `UIThemeComponentsConfig`.
- Do not leave old token names partially in use after a refactor.
- Do not add a second theming path when the layout-based global theme pipeline already handles the use case.
- Do not finish theme work without tests and typecheck.

## Completion Checklist

Before finishing a theme-related task:

- [ ] Asked whether a new reusable component should be themeable, when applicable
- [ ] Ensured new reusable component architecture can support theming (implemented now or intentionally prepared)
- [ ] Preserved shared vs component-specific token boundaries
- [ ] Updated type registration if a new themeable component was added
- [ ] Updated generator composition if needed
- [ ] Updated defaults if new tokens were introduced
- [ ] Added or updated tests
- [ ] Relevant tests passed
- [ ] Changed theme logic is covered 100% by focused tests
- [ ] Ran `pnpm run type:check`
