---
description: "Use when adding or updating theme documentation collection entries or the standalone theme guide page."
applyTo: "src/content.config.ts,src/content/theme-guides/**,src/pages/theme-system/index.astro"
---

# Theme Guides Collection

## Purpose

Maintain a dedicated Astro content collection that documents how the theme system is used and extended.

This documentation must remain:

- collection-driven (content files, not hardcoded page sections)
- typed through `src/content.config.ts`
- independent from global navigation unless explicitly requested
- example-rich and implementation-oriented

## Required Structure

- Collection definition lives in `src/content.config.ts`
- Theme guide entries live in `src/content/theme-guides/**`
- Standalone rendering page lives in `src/pages/theme-system/index.astro`

## Authoring Rules

1. Use frontmatter with explicit metadata (`title`, `summary`, `order`, optional `updatedAt`).
2. Keep entries practical: explain intent, runtime flow, and extension steps.
3. Include code examples for common actions (new theme name, new themed component).
4. Keep guidance aligned with the actual source files under `src/share/utils/theme/**` and `src/share/types/theme/**`.
5. For `pt` overrides, document class and style as separate use-cases to reduce confusion.
6. When documenting class-based overrides in Astro, explicitly note that styles are scoped and `:global(...)` is required to target runtime classes.
7. When showing code snippets in docs, clarify whether the snippet is an example or runtime source-of-truth, and include "where to find it" pointers.
8. Add a concise "mental model" section for complex guides (especially form controls) so readers can distinguish theme config, token defaults, and one-off `pt` overrides.
9. Include a short troubleshooting checklist for common override failures (wrong target element, selector specificity, missing `:global`, token mismatch).
10. Keep token naming aligned with runtime source-of-truth (`base-input.css`, `input-field.css`, and the corresponding style-var generators).
11. When adding `pt` documentation for any component, follow the **exact** 11-section structure defined in the `theme-guides` skill (`SKILL.md`). Do not skip, reorder, or merge sections. Use `src/content/theme-guides/input-text-reference.md` as the canonical example of the complete correct structure.

## Implementation Rules

- Retrieve collection entries via `getCollection('themeGuides')`.
- Sort by `order` before rendering.
- Render content using `render(entry)` from `astro:content`.
- If the page has an "On This Page" index, include both guide-level links and section heading links (at least heading depth 2-3).
- Do not add links to this page in site navigation unless explicitly requested.

## Validation

After editing the collection setup or theme guide page:

- run `pnpm run type:check`
- run relevant tests when theme behavior examples or referenced APIs changed
- ensure the standalone page still builds and renders collection content
