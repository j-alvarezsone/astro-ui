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

## Validation

At minimum after updates:

- `pnpm run type:check`
- relevant tests when documentation references changed behavior
