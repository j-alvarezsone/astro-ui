# Project Guidelines

## Architecture

- Astro-first component library with optional Vue/web-component interop.
- Key boundaries:
  - `src/components/`: Astro UI components (prefer SSR-first patterns)
  - `src/web-components/`: custom elements (`*.web.ts`) for cross-framework behavior
  - `src/share/types/`: shared type declarations
  - `src/share/utils/`: reusable utilities
  - `src/assets/css/`: design tokens and global styles
- Favor semantic HTML and accessibility-first APIs in shared UI primitives.

## Build And Test

- Run from repository root with `pnpm`.
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Preview build: `pnpm preview`
- Lint: `pnpm run lint`
- Autofix lint: `pnpm run lint:fix`
- Type check: `pnpm run type:check`
- Unit tests: `pnpm test`
- Unit tests (watch): `pnpm run test:watch`
- Unit tests (coverage): `pnpm run test:coverage`
- Regenerate icon name types: `pnpm run generate:icons`

## Code Style

- Linting enforced via oxlint (see `.oxlintrc.json`); TypeScript strict via `astro/tsconfigs/strict` (see `tsconfig.json`).
- Naming (not lint-enforced): Components/types: PascalCase; variables/functions: camelCase; constants: UPPER_SNAKE_CASE.
- Import order: external → aliases → project absolute → relative.

## Conventions

- Prefer path aliases for `src/` imports:
  - `@components/*`
  - `@layouts/*`
  - `@web-components/*`
  - `@/types/*`
- In TypeScript type aliases, prefer shared helper types from `src/share/types/index.ts`:
  - `Keyof<T>` over raw `keyof T`
  - `ValueOf<T>` over manual indexed unions like `T[keyof T]`
- Keep edits scoped and avoid unrelated file changes.
- Before finalizing changes, run at least `pnpm run type:check`; run `pnpm run lint` for lint-impacting changes.
- If blocked or ambiguous, state assumptions and choose the lowest-risk implementation.
- **CSS token enforcement:** Never use a `var(--...)` that does not exist in `src/assets/css/tokens.css`. If a token is missing, stop and ask the user: _"The token `--your-token` does not exist in `tokens.css`. Would you like me to create it?"_ Only proceed after explicit confirmation and after adding the token to `tokens.css`. Do not invent or guess token names.

## Hooks And Commits

- Husky + lint-staged are enabled; staged `*.{js,ts,mjs,cjs,astro,vue}` files are linted.
- Keep PRs focused and include verification commands run.

## Skills

Always load and follow the relevant skill(s) before proceeding with tasks in these areas:

| Trigger                                                      | Skill                       |
| ------------------------------------------------------------ | --------------------------- |
| Editing `.astro` files, content collections, SSR, islands    | `astro-dev`                 |
| Creating new Astro components, pages, adapters               | `astro`                     |
| Editing `.vue` files, Composition API, Pinia, Vue Router     | `vue-best-practices`        |
| Vue runtime errors, hydration issues, warnings               | `vue-debug-guides`          |
| Building UI, landing pages, styling, design systems          | `frontend-design`           |
| Accessibility audit, WCAG, aria, keyboard nav                | `accessibility`             |
| Linting errors, configuring oxlint, `.oxlintrc.json`         | `oxlint`                    |
| Senior TypeScript architecture and type debugging            | `typescript-wizard`         |
| Complex TypeScript types, generics, mapped/conditional types | `typescript-advanced-types` |
| SEO, meta tags, structured data, sitemap                     | `seo`                       |
| Writing Vitest unit tests, test coverage, test setup         | `vitest`                    |
