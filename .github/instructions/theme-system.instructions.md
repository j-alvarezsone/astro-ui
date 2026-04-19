---
description: "Use when editing the theme system, adding UI themes, introducing themed components, changing CSS custom-property naming, or modifying files under src/share/utils/theme, src/share/types/theme, src/assets/css/theme, or theme-aware form components."
applyTo: "src/share/utils/theme/**,src/share/types/theme/**,src/assets/css/theme/**,src/layouts/Layout.astro,src/components/form/InputField.astro,src/components/form/InputLabel.astro,src/components/form/InputText.astro,src/pages/index.astro"
---

# Theme System Guidelines

## Purpose

This project uses a typed component theme system that converts structured theme config into CSS custom properties injected globally by the layout.

The system must stay:

- typed while authoring themes
- reusable across shared field-shell components
- explicit about shared vs component-specific tokens
- easy to extend without turning one file into a dumping ground
- capable of supporting theming for any new reusable component

## Optional Custom Themes

Custom themes are optional in this project.

- Do not assume at least one named custom theme exists in `UI_THEMES`.
- Runtime behavior must remain valid when `UI_THEMES` is empty.
- Tests must not hardcode a required custom theme name (for example `warm`) unless the test is explicitly about that concrete sample theme.
- Prefer dynamic assertions based on discovered theme names where applicable.

## Source Of Truth

When editing the theme system, align with these files:

- `src/share/utils/theme/uiThemes.ts` — actual named theme data
- `src/share/types/theme/uiThemes.ts` — registry of themeable components
- `src/share/utils/theme/createComponentThemeCss.ts` — composition point for style-var generators
- `src/share/utils/theme/theme.ts` — theme resolution and runtime CSS creation
- `src/share/utils/theme/form/inputFieldConfig.ts` — shared field-shell style vars
- `src/share/utils/theme/form/inputTextConfig.ts` — InputText-only style vars and pass-through helpers
- `src/share/types/theme/form/inputField.ts` — shared field-shell config type
- `src/share/types/theme/form/inputText.ts` — InputText config and pass-through types
- `src/assets/css/theme/input-field.css` — default shared field-shell token values
- `src/assets/css/theme/input-text.css` — default InputText-only token values

## Architecture Rules

### 1. Separate shared shell styling from control-specific styling

Use `input-field` tokens for styling that belongs to the reusable field shell:

- root spacing
- wrapper background, border, hover, focus, error, disabled
- label colors and background
- icon color and disabled opacity
- help and error text colors

Use `input-text` tokens only for text-control-specific styling:

- input text color
- input padding block
- placeholder colors
- disabled text color

Do not put shared field-shell styling under `input-text-*` names.

### 2. Treat InputField as the reusable shell for text-like controls

`InputField` is intended to support:

- InputText
- InputEmail
- InputPassword
- Textarea
- Select

Do not force checkbox or radio into this shell unless the structure is intentionally redesigned for them.

### 3. Keep type files narrow and component-specific

Do not reintroduce one catch-all `form.ts` for all themed controls.

Use this split:

- `form/shared.ts` for primitives like `ClassValue`, `StyleValue`, `PassThroughAttributes`
- `form/inputField.ts` for shared field-shell config
- `form/inputText.ts` for InputText-specific config and pass-through types
- future components should get their own files such as `form/select.ts`, `form/textarea.ts`, `form/inputPassword.ts`

### 4. Keep theme registration centralized

Every component that can appear inside `UI_THEMES` must be registered in `src/share/types/theme/uiThemes.ts`.

Autocomplete inside `UI_THEMES` depends on `UIThemeComponentsConfig`.

If a component is not registered there, theme authoring for that component is incomplete.

### 5. Keep theme authoring typed

Use the typed `defineUIThemes(...)` pattern in `src/share/utils/theme/uiThemes.ts`.

Do not replace it with an untyped object or broad `Record<string, unknown>` shape.

The authoring experience should provide autocomplete for nested theme config keys while editing theme objects.

### 5.1 Prefer shared key/value helper aliases in theme type aliases

When deriving exported key or value aliases inside theme-system TypeScript files, prefer shared helpers from `src/share/types/index.ts`:

- use `Keyof<T>` instead of raw `keyof T`
- use `ValueOf<T>` instead of manual indexed unions like `T[keyof T]`

This keeps type alias style consistent across theme utilities and avoids mixed patterns in public theme typings.

### 6. New reusable components must be theme-capable by design

When creating a new reusable component, do not hardcode a styling model that blocks theming.

Required approach:

- ask whether the user wants theme wiring implemented now
- if yes, implement full theme support in the same task
- if not now, keep the component styling and API ready for future theme wiring with minimal refactor

Theme-ready means:

- styling surfaces are controlled by CSS custom properties
- config types can be added in `src/share/types/theme/...` without breaking component API
- style-var generation can be attached in `src/share/utils/theme/...`

## Naming Rules

### Shared field shell tokens

Use:

- `--input-field-root-gap`
- `--input-field-wrapper-*`
- `--input-field-label-*`
- `--input-field-icon-*`
- `--input-field-help-*`
- `--input-field-error-*`

### InputText-only tokens

Use:

- `--input-text-input-*`

### Future component-specific tokens

For new components, use the narrowest correct namespace:

- `--select-*`
- `--textarea-*`
- `--input-password-*`

Do not use a component-specific namespace for styling that belongs to the shared field shell.

## How To Add A New Theme Name

If you are only adding a new named theme and not a new component:

1. Edit `src/share/utils/theme/uiThemes.ts`
2. Add a new top-level theme entry next to existing themes
3. Override only the component values that differ from defaults
4. Preserve the existing typed shape
5. Run `pnpm run type:check`

Prefer sparse overrides. Do not duplicate all default values into every theme.

## How To Add A New Themed Component

Follow this sequence.

1. Decide whether the component reuses `InputField` or needs a unique structure.
2. Create a dedicated type file under `src/share/types/theme/form/`.
3. Register the component in `src/share/types/theme/uiThemes.ts`.
4. Create a style-var generator under `src/share/utils/theme/...`.
5. Add default CSS variable values under `src/assets/css/theme/` if the component introduces new tokens.
6. Add the generator to `src/share/utils/theme/createComponentThemeCss.ts` if it participates in runtime theme output.
7. Use the generated CSS variables in the component CSS.
8. Add or update tests.
9. Run `pnpm run type:check`.
10. Ensure relevant tests pass and changed theme-related logic has 100% coverage in focused tests for the modified behavior.

## Composition Rules

`src/share/utils/theme/createComponentThemeCss.ts` is the place where style-var generators are composed.

Keep `src/share/utils/theme/theme.ts` orchestration-only.

If composition grows substantially, prefer extracting clearer named composition helpers instead of growing `theme.ts` with arrays and conditional logic.

## Runtime Flow

The runtime flow must stay:

1. Theme name is passed into `Layout.astro`
2. `getComponentsThemeCss(themeName)` resolves the theme
3. Each component config is converted into CSS declarations
4. CSS is injected globally by the layout

Do not introduce parallel theming paths unless there is a clear requirement.

The project intentionally removed `FormStyleProvider` to keep a single theming path.

## What Not To Do

- Do not put all future themed control types back into one file.
- Do not use `input-text-*` for shared field-shell tokens.
- Do not add a component to `UI_THEMES` without adding it to `UIThemeComponentsConfig`.
- Do not generate unused theme values that are never consumed by CSS.
- Do not add local wrapper-based theme systems when the global theme pipeline already solves the problem.
- Do not clone the full InputText theme stack for `InputEmail` or `InputPassword` if they can reuse `InputField`.

## Validation

After editing the theme system, run at minimum:

- `pnpm run type:check`

When changing theme utilities or token generation:

- run the relevant tests
- ensure those tests pass
- ensure changed theme-related logic is covered 100% in focused tests for the modified behavior
