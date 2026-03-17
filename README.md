<!-- Project README tailored for contributors and agentic tooling -->

# Astro UI — Component Library

This repository contains a small UI component library built with Astro and Vue. It
focuses on reusable components, TypeScript safety, and partial hydration (component
islands) for optimal client performance.

Quick start (from project root)

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev` (hot reload)
3. Build: `pnpm build`
4. Preview production build: `pnpm preview`

Useful scripts

- `pnpm run lint` — run linter (`oxlint`)
- `pnpm run lint:fix` — auto-fix lint issues
- `pnpm run type:check` — run TypeScript/Astro checks (`pnpm astro check`)
- `pnpm run generate:icons` — regenerate icon name types (`./scripts/generate-icon-names.mts`)

Testing

This repo does not include a test runner by default. We recommend `vitest` for unit
and DOM tests. To add it:

```
pnpm add -D vitest @testing-library/dom @testing-library/jest-dom
# add a `test` script to package.json: "test": "vitest"
```

Developer notes

- Code style and linting are enforced via `oxlint` (see `.oxlintrc.json`). The project
  uses strict TypeScript settings (`tsconfig.json` extends `astro/tsconfigs/strict`).
- Use the configured path aliases: `@components/*`, `@layouts/*`, `@web-components/*`,
  and `@/types/*` for imports from `src/`.
- Prefer `import type` for type-only imports and avoid `any`. Handle floating promises
  and always narrow `unknown` in `catch` blocks.

Agent guidance and automation

- This repo includes `AGENTS.md` with instructions for agentic coding tools. Agents
  should read `AGENTS.md` before making changes.
- Follow `.github/copilot-instructions.md` for project-specific Copilot rules and
  architecture guidance.

Contributing

- Run `pnpm run lint` and `pnpm run type:check` before committing. Husky pre-commit
  hooks run lint-staged to enforce linting on changed files.
- Keep changes small and focused; add tests when introducing logic or public APIs.

License

Refer to the repository root for license information (if any).
