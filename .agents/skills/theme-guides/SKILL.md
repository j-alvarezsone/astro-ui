---
name: theme-guides
description: Build and maintain the Astro theme documentation collection and standalone guide page. Use when asked to document theme usage, add examples, create collection entries, or update the dedicated theme docs route without adding navigation links.
---

# Theme Guides

This skill keeps theme documentation consistent, discoverable, and collection-driven.

Use it when the task requires:

- documenting how to use or extend the theme system
- adding practical examples for UI themes
- creating or updating content entries in `src/content/theme-guides/**`
- changing `src/content.config.ts` for theme docs schema
- updating `src/pages/theme-system.astro`

## Workflow

1. Ensure the `themeGuides` collection exists in `src/content.config.ts` with typed frontmatter schema.
2. Add or update entries under `src/content/theme-guides/**`.
3. Keep each entry focused on actionable steps and real code snippets.
4. Render entries in `src/pages/theme-system.astro` using `getCollection` + `render(entry)`.
5. For multi-entry render operations, use `Promise.all(...)` over mapped async tasks instead of `await` in loops.
6. If the page contains an "On This Page" section, include both guide-level links and section heading links (heading depth 2-3).
7. In the page template shell, prefer the shared `Heading` component over raw `h1`/`h2` tags.
8. Keep the page standalone unless the user explicitly asks for navigation changes.

## Content Standards

Each guide entry should include:

- what problem this part of the theme system solves
- where source-of-truth files live
- step-by-step extension flow
- at least one code example
- separate `pt` class and `pt` style examples when both are documented
- explicit `:global(...)` guidance when using class-based overrides in Astro
- clear distinction between docs-only examples and runtime source-of-truth files
- validation expectations (`type:check`, relevant tests)

## Required `pt` Documentation Structure

When documenting `pt` (pass-through) for a component, **always** follow this structure in order. Do not skip sections.

### 1. Quick Mental Model

A short 3-layer mental model specific to the component:

- **Theme config layer** — what keys live under `components.<componentKey>` and what they control.
- **Token defaults layer** — which CSS files hold the defaults (`src/assets/css/theme/*.css`).
- **Instance override layer (`pt`)** — when to use `pt` vs theme config.

### 2. Source Of Truth

List all relevant source files for the component being documented. The exact paths depend on the component — always use the actual files, not placeholder paths. Typical categories to cover:

- Component `.astro` file(s)
- Type files (`src/share/types/theme/**/*.ts`)
- Config/generator files (`src/share/utils/theme/**/*.ts`)
- CSS token default files (`src/assets/css/theme/*.css`)

Always add **Practical alignment notes** below the list:

- Where runtime token consumption happens (which `.astro` file).
- Where default token values come from (which CSS files).
- Rule: keep generator output names and consumed token names aligned when refactoring.

### 3. `pt` Sections

List every supported `pt` section by name. **The sections are always component-specific** — always derive them from the component's actual implementation. Do not copy-paste section names from another component.

State what each section accepts:

- `class` (string or array of strings)
- `style` (string or object)
- arbitrary HTML attributes (`data-*`, `aria-*`, `id`, etc.)

### 4. Example A — `pt.class` + `<style>` tag override

Label as: `This snippet is an example pattern (not runtime source-of-truth):`

Must demonstrate (using the component's actual `pt` sections — not a fixed list):

- A **scope hook** class (the outermost section) used for descendant selectors — **only if the component has one**
- A **container/wrapper** class (if the component has one) as an array with layered roles (base class, modifier class, state/variant class)
- A **control/leaf element** class (the innermost interactive or visual section) — this is the minimum required; if the component has no outer sections, start here
- Token-based overrides using `:global(...)` for each class (one responsibility per class)
- At least one combined high-specificity selector example for direct native property override

Add a component note below the snippet:

- Explain what the scope hook section is for in this specific component.
- Explain where the main visual overrides should target.
- Reference `theme-system-overview.md` -> `Pass-Through Class Strategy` for general guidance.

### 5. Example B — `pt.style` (inline style string/object)

Demonstrate both:

- Object style: `{ backgroundColor: 'orange' }`
- String style: `'--token-name: value; letter-spacing: 0.02em;'`

### 6. Example C — arbitrary attributes (`data-*`, `aria-*`, `id`)

Demonstrate:

- `id` on wrapper, input, label, helpText, errorText
- `data-ui` attributes
- `aria-*` where semantically appropriate

Add `<style>` block after snippet showing:

- Native property override via `id` (high specificity, wins directly)
- Token override via `id` (recommended for theming)
- Token override via `[data-ui='...']` attribute selector

### 7. What Is Possible

Brief summary:

- Both native CSS properties and component token variables are supported.
- State preference: prefer token overrides for production theming; use direct native CSS for local exceptions.

### 8. Style Config Keys

Split into two sub-sections:

- **Shared keys** (`InputFieldStyleConfig` or equivalent shared config) — list all keys with types.
- **Component-only keys** — list all keys with types.

Add an example showing a real named theme using the keys, and explain **why the split matters** (which part of the component consumes each group).

### 9. CSS Custom Properties

List all CSS custom properties consumed by the component. Group them logically based on the component's actual token structure. Each group should be a full `:root {}` block with its default values.

Common groupings (use only what applies to the component):

- **Component-specific tokens** — tokens owned exclusively by this component.
- **Shared tokens** — tokens shared with other components (e.g., a common shell or container).

### 10. Troubleshooting

A short numbered checklist:

1. Check target element choice (wrapper vs control element).
2. Check selector specificity (single class vs combined or id).
3. Check Astro style scoping (`:global(...)` required).
4. Check token wiring (confirm defaults file and runtime consumption file).

### 11. Runtime CSS Classes

Full list of CSS classes rendered by the component at runtime. Note:

- Use `:global(...)` when targeting these from `pt` styles.
- Astro styles are scoped by default.

End with a `<style>` code snippet showing one token override and one control-element token override as a real quick-reference example.

## Validation

At minimum after updates:

- `pnpm run type:check`
- relevant tests when documentation references changed behavior
