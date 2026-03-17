Agents Guide for repository agents

## Purpose

This file provides concise, machine- and human-readable instructions for agentic coding
agents operating in this repository. It focuses on: build/lint/test commands, how to run a
single test, and repository code-style and error-handling conventions derived from the
project config files (`package.json`, `.oxlintrc.json`, `tsconfig.json`, `README.md`).

Use these rules to make changes that are consistent, easy to review, and safe to commit.

Commands (run from repository root)

- `pnpm install` — install dependencies (use when workspace is new)
- `pnpm dev` — start Astro dev server (hot reload)
- `pnpm build` — build production site to `./dist`
- `pnpm preview` — preview the production build locally
- `pnpm run astro -- --help` — run Astro CLI commands
- `pnpm run lint` — run project linter (`oxlint`) (configured in package.json)
- `pnpm run lint:fix` — run `oxlint --fix` to auto-fix issues
- `pnpm run type:check` — run TypeScript/astro checks (`pnpm astro check`)
- `pnpm run generate:icons` — regenerate icon name types (script at `./scripts`)

Husky / git hooks

- Hooks installed via `husky` (see `.husky/`); `lint-staged` runs `pnpm run lint` on
  staged files matching `*.{js,ts,mjs,cjs,astro,vue}`.

Testing

- This repository does not include a test runner by default. Recommended test runner:
  `vitest` (works well with Vite/Astro). To add it:
  1. `pnpm add -D vitest @testing-library/dom @testing-library/jest-dom`
  2. Add an npm script: `"test": "vitest"` and optional `"test:run": "vitest run"`.

- Common vitest examples (once installed):
  - Run all tests: `pnpm exec vitest` or `pnpm run test`
  - Run tests once (CI mode): `pnpm exec vitest run`
  - Run a single test file: `pnpm exec vitest run path/to/file.test.ts`
  - Run a single test by name: `pnpm exec vitest -t "should do X"`
  - Watch mode: `pnpm exec vitest --watch`

  When asking an agent to run or create tests, prefer `vitest` conventions above. If the
  repository later adopts a different runner, follow that runner's single-file / name
  filters (e.g., `jest -t` or `pytest path::test_fn`).

Code Style and Linting

- Linter: `oxlint` (config: `.oxlintrc.json`). Important rules enforced in this repo:
  - `no-console` is an error except `console.warn` and `console.error` are allowed
  - Many TypeScript safety rules are `error` (no `any`, no unsafe-assignment, no-floating-promises,
    require-await, switch-exhaustiveness-check, only-throw-error, use-unknown-in-catch, etc.)

- Formatting
  - Use `oxlint --fix` (`pnpm run lint:fix`) for automatic fixes; repository includes
    `prettier` in `node_modules`, so formatters are available. Keep lines readable (wrap
    at ~100 chars) and prefer consistent spacing.

- Imports
  - Group ordering: external packages -> aliased imports -> absolute project imports -> relative
    imports (from least-specific to most-specific). Separate groups with a blank line.
  - Use the tsconfig path aliases where appropriate: `@components/*`, `@layouts/*`,
    `@web-components/*`, `@/types/*` (see `tsconfig.json`). Prefer these over long relative
    paths when importing from `src/`.
  - Use `import type { ... } from '...'` for type-only imports when possible to avoid runtime
    overhead and to make intent explicit (consistent with `typescript/consistent-type-imports`).

- Exports and filenames
  - Component files and exported component constructors: PascalCase file names, e.g.
    `Button.astro`, `Heading.astro`, `Layout.astro` (already used in `src/components`).
  - Utility modules: camelCase filenames (e.g., `formatDate.ts`) and named exports.
  - Types and interfaces: PascalCase (no `I` prefix). e.g. `type User = { ... }` or
    `interface UserData { ... }`.

- Types and TypeScript rules
  - This project extends `astro/tsconfigs/strict`. Maintain strict typing: avoid `any`.
  - Prefer `unknown` in catch clauses and narrow before use. Example:

    ```ts
    try {
      await something();
    } catch (err: unknown) {
      if (err instanceof Error) {
        // safe to read err.message
      }
    }
    ```

  - Always address `no-floating-promises`: either `await` promises or explicitly handle
    them (`void somePromise()` with a clear comment only when fire-and-forget is intended).
  - Use `return` types for public functions and avoid inferring complicated union return types.

- Naming conventions
  - Variables & functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE` for compile-time constants, `PascalCase` for exported
    React/Vue/Astro components and types
  - Files: `PascalCase` for components, `kebab-case` or `camelCase` for utilities is acceptable
    but stay consistent within any given folder.

- Error handling
  - Throw errors with `new Error(...)`; do not throw raw strings or non-Error values
    (enforced: `typescript/only-throw-error`).
  - Use typed error guards where possible. Surface helpful messages and avoid leaking
    internal values in user-facing errors.
  - For async flows, prefer `try/catch` around awaited operations; for top-level handlers
    return a `Response` or an explicit `Result` object rather than letting errors bubble
    to untyped environments.

Repository and commit hygiene for agents

- Do not modify unrelated files in the working tree. If you must, explain why in the commit
  message and keep changes scoped and minimal.
- Follow existing commit hooks (`husky`) and lint-staged configuration. Agents should run
  `pnpm run lint` before creating a commit and fix issues where possible.

Cursor / Copilot rules

- `.cursor` rules: none found in repository location.
- Copilot instructions: this repo includes a project-specific Copilot guide at
  `.github/copilot-instructions.md`. Agents MUST read and follow it; it has higher
  priority for behavior guidance. Key highlights agents should obey:
  - Project overview & goals: focus on reusability, performance, DX, accessibility,
    maintainability, and cross-framework compatibility.
  - Architecture: follow the recommended layout (`src/components`, `src/layouts`,
    `src/web-components`, `src/share/types`, `src/assets`) and component roles
    (Astro components for SSR, Vue for interactive, web components for cross-framework).
  - TypeScript & error handling: strict mode, avoid `any`, prefer `unknown` in catches,
    use `import type`, and handle floating promises.
  - Naming & imports: PascalCase for components and types, camelCase for utils,
    use tsconfig path aliases (`@components/*`, `@layouts/*`, `@/types/*`, `@web-components/*`),
    and group imports (external → aliases → project → relative).
  - Testing & tooling: prefer Vitest for automated tests; manual testing is ok during
    development. Add test scripts to `package.json` when introducing tests.
  - Styling, accessibility, and performance guidance (design tokens, BEM, partial hydration,
    use semantic HTML, ARIA, keyboard navigation).

  See the full file at `.github/copilot-instructions.md` for examples and code snippets.

How to safely run commands

- Use the project package manager: `pnpm` (package.json has `packageManager: "pnpm@..."`).
- When adding dev dependencies (like `vitest`), prefer `pnpm add -D <pkg>` and update
  `package.json` scripts so other agents know how to run tests.

When making pull requests

- Keep changes small and self-contained. Provide a short description and link to related
  files. Run `pnpm run lint`, `pnpm run type:check`, and `pnpm build` locally before creating
  a PR. If you add tests, include a command to run them and show passing output in the PR.

If you're blocked

- Run `pnpm run lint` and `pnpm run type:check` to surface static issues. If a task is
  ambiguous (multiple reasonable defaults), pick the option that minimizes risk and state
  the assumption in the PR description.

Notes

- This document synthesizes repository conventions from `package.json`, `.oxlintrc.json`,
  and `tsconfig.json`. If you change linter rules or tsconfig, update this file to match.
