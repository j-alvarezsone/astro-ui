---
name: theme-guides
description: Build and maintain the Astro theme documentation collection and standalone guide page. Use when asked to document theme usage, add examples, create collection entries, or update the dedicated theme docs route without making any changes to navigation links.
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
6. Keep the page standalone unless the user explicitly asks for navigation changes.
7. If multiple documentation updates conflict (e.g., overlapping frontmatter fields or contradictory examples), prioritize the most recent instruction or ask the user for clarification before proceeding.

### Mandatory steps when creating a new component reference entry

When a **new** component reference guide is created (e.g. `button-reference.md`), you MUST also perform the following two steps as part of the same task — do not skip them:

**Step A — Create the dedicated theme-system page**

Create `src/pages/theme-system/<component-name>.astro` following the pattern of existing pages (e.g. `chips.astro`, `input-field.astro`):

- Import `getEntry`, `render` from `astro:content` and resolve the new entry by its collection id.
- Import `ComponentSlotsDemo`, `ThemeDocArticle`, `ThemeLayout`.
- Import the component's `*_PT_SLOT_NAMES` constant from `src/share/types/theme/...` and call `createComponentSlots(...)`.
- Import the actual UI component and render a live demo inside `<ComponentSlotsDemo>`.
- Pass `headings` from `getFilteredHeadings(rendered)` to `ThemeLayout`.
- Set a meaningful `secondaryHref` / `secondaryLabel` pointing to a related page.
- Throw an error if `getEntry` returns nothing.

**Step A.1 — Verify `ComponentSlotsDemo` slot highlights work correctly**

After creating the page, audit every slot in the live demo. The slot-highlight system draws an `outline` on elements matched by the selector. Two common failure modes must be checked and fixed:

| Failure | Symptom | Fix |
|---------|---------|-----|
| **`overflow: hidden` on root clips child outlines** | Hovering any non-root slot shows no visible outline ring because the root element clips it (common in components that use `overflow: hidden` for effects like ripple) | Add a scoped `:global` override: `:global(.slots-demo__preview .<root-class>) { overflow: visible !important; }` in the page `<style>` block |
| **Slot element is `position: absolute; inset: 0`** | Hovering the slot highlights the entire root area instead of just the element (e.g. a loader wrapper that fills the button) | Pass a `selectorOverrides` entry to `createComponentSlots` pointing to a more specific inner element, e.g. `{ loader: '.button__loader .loader__spinner' }` |

Checklist — verify each slot before shipping:

1. **Every slot item in the panel activates a highlight** — if `targets.length === 0` the item silently does nothing. Check the browser console for `Invalid selector` errors.
2. **The highlight outlines the correct element** — the outline must be tight around the semantic part, not the full root box.
3. **No slot outline is clipped** — if the component uses `overflow: hidden` on its root (e.g. for a ripple effect), any child slot outline will be invisible. Add the `overflow: visible !important` override on `.slots-demo__preview .<root-class>` regardless of which slots are affected.
4. **Loading / conditional slots are present in the demo** — slots that only render in a specific state (e.g. `loader` only when `isLoading=true`) must have at least one demo instance in that state so the selector matches something in the DOM.

Example with both fixes applied (Button page):

```astro
const BUTTON_SLOTS = createComponentSlots('button', BUTTON_PT_SLOT_NAMES, {
  // .button__loader fills the whole button (position: absolute; inset: 0)
  // — target the inner spinner so the highlight is tight.
  loader: '.button__loader .loader__spinner',
});
```

```astro
<style>
  /* Button uses overflow: hidden for ripple — allow child outlines to show. */
  :global(.slots-demo__preview .button) {
    overflow: visible !important;
  }
</style>
```

**Step B — Register the component in `THEME_COMPONENT_REFS`**

Add a new entry to `src/share/constants/theme-component-refs.ts`:

```ts
{
  label: '<ComponentName>',
  description: '<short description matching the guide summary>',
  category: '<Form | Misc | UI | ...>',
  href: '/theme-system/<component-name>',
},
```

This entry is rendered on `src/pages/theme-system/index.astro` via `<ComponentRefs refs={THEME_COMPONENT_REFS} />` and is the primary way users discover the new page from the index.

**If the page contains an "On This Page" section:** include both guide-level links and section heading links (heading depth 2-3).

**In the page template shell:** prefer the shared `Heading` component over raw `h1`/`h2` tags.

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

**Structure at a glance:**

| # | Section | What it covers |
|---|---------|----------------|
| 1 | Quick Mental Model | 3-layer model: theme config, token defaults, `pt` overrides |
| 2 | Source Of Truth | All relevant source files + alignment notes |
| 3 | `pt` Sections | Every supported slot and what it accepts |
| 4 | Example A | `pt.class` + `<style>` tag override |
| 5 | Example B | `pt.style` inline style string/object |
| 6 | Example C | Arbitrary attributes (`data-*`, `aria-*`, `id`) |
| 7 | What Is Possible | Brief capability summary |
| 8 | Style Config Keys | Shared keys vs component-only keys |
| 9 | CSS Custom Properties | All consumed tokens grouped by type |
| 10 | Troubleshooting | Numbered checklist for common override failures |
| 11 | Runtime CSS Classes | Full list of rendered classes with usage notes |

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
