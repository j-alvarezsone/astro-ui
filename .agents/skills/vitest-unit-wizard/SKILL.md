---
name: vitest-unit-wizard
description: Expert Vitest unit testing skill for writing professional, type-safe, and comprehensive test suites. Use when asked to write unit tests, add test coverage, create test files, configure Vitest, set up test environments, test web components, test pure functions, mock dependencies, or improve existing test quality. Enforces zero `any`/`unknown` abuse, meaningful coverage, and idiomatic Vitest patterns.
---

# Vitest Unit Wizard

Expert workflow for writing professional Vitest test suites: correct types, full scenario coverage, readable structure, and predictable assertions.

## When to Use This Skill

- Creating new test files (`*.test.ts`, `*.spec.ts`) for any module
- Adding tests for exported functions, classes, or custom elements
- Setting up Vitest configuration (`vitest.config.ts`)
- Choosing and configuring a DOM environment (`happy-dom`, `jsdom`)
- Mocking modules, timers, or browser globals
- Reviewing or improving an existing test file
- Debugging flaky or incorrect assertions

## Prerequisites

- `vitest`, `happy-dom`, and `@vitest/coverage-v8` in `devDependencies`
- `vitest.config.ts` at repository root with path aliases matching `tsconfig.json`
- TypeScript strict mode enabled — never disable it for tests
- `pnpm test --run` to verify all tests pass before finishing
- `pnpm test:coverage` to check coverage thresholds

---

## Core Rules (Non-Negotiable)

### 1. Zero `any` in Tests

Never use `any` or cast with `as any`. Tests are the highest-value place for precise types.

```ts
// ❌ NEVER
const el = document.createElement('astro-form') as any;
el.querySelector('form').reset();

// ✅ ALWAYS — narrow with instanceof or explicit type
const el = document.createElement('astro-form');
const form = el.querySelector('form');
if (!(form instanceof HTMLFormElement)) throw new Error('form not found');
form.reset();
```

### 2. Prefer `instanceof` Over Type Assertions

```ts
// ❌ NEVER (unsafe assertion hides real errors)
const input = form.elements.namedItem('username') as HTMLInputElement;

// ✅ ALWAYS (real narrowing, readable error on failure)
const input = form.elements.namedItem('username');
if (!(input instanceof HTMLInputElement)) throw new Error('input[name=username] not found');
```

### 3. One Concept Per Test

Each `it()` tests exactly one observable behaviour. Do not bundle unrelated assertions under a single description.

```ts
// ❌ TOO MUCH — two separate concerns
it('sets value and is a string', () => {
  applyToElement(input, 42);
  expect(input.value).toBe('42');
  expect(typeof input.value).toBe('string'); // redundant; value is always string
});

// ✅ FOCUSED
it('coerces a number to string when setting value', () => {
  applyToElement(input, 42);
  expect(input.value).toBe('42');
});
```

### 4. Meaningful Test Descriptions

Descriptions must read as human-readable sentences. Use `does X when Y` or `returns Z for Y` patterns.

```ts
// ❌ VAGUE
it('works', ...);
it('handles input', ...);

// ✅ CLEAR
it('returns empty string for null', ...);
it('checks the matching radio option and unchecks the others', ...);
```

### 5. Always Test the Default / "Nothing" Case

Cover nulls, empty inputs, missing elements, and invalid data. These are the most common real-world failure paths.

### 6. Always Test Reset / Teardown Parity

For stateful subjects (classes, custom elements, stores), verify that state is fully restored after reset/destroy.

---

## Step-by-Step Workflow

### Step 1 — Understand the module under test

Read every exported symbol. Build a mental model of:
- Pure functions: what inputs → what outputs?
- Classes / custom elements: what lifecycle callbacks exist? what side-effects occur?
- Type guards: what shape is accepted vs. rejected?

### Step 2 — Plan coverage matrix

For each exported function/class, list:
1. **Happy path** — typical, expected inputs
2. **Edge cases** — empty string, 0, `null`, `undefined`, empty arrays/objects
3. **Invalid input** — wrong type, missing field, malformed data
4. **Bound behaviour** — exact min/max if dealing with sizes, counts, or ranges
5. **State transitions** — before, during, after for lifecycle methods

### Step 3 — Set up describe/it structure

```ts
describe('functionName', () => {
  // shared setup (beforeEach / helpers inline — not in global scope)

  it('happy path description', ...);
  it('edge case description', ...);
  it('invalid input description', ...);
});
```

Keep helpers (`buildForm`, `makeInput`, etc.) inside the file — not imported from shared utilities unless genuinely reused across multiple test files.

### Step 4 — Write assertions that can actually fail

Every `expect()` must be capable of failing. If an assertion can never fail, it adds noise, not confidence.

```ts
// ❌ CANNOT FAIL — value is always a string
expect(typeof input.value).toBe('string');

// ✅ CAN FAIL — specific value check
expect(input.value).toBe('expected value');
```

Prefer the most specific matcher available:

| Situation | Use |
|---|---|
| Exact primitive equality | `toBe` |
| Deep object equality | `toEqual` |
| Array contents | `toEqual([...])` |
| Substring | `toContain` |
| Boolean | `toBe(true)` / `toBe(false)` — never `toBeTruthy` unless intentional |
| Error thrown | `toThrow` / `toThrowError` with message |
| Not throwing | `not.toThrow()` wrapped in a function |
| Called with args | `toHaveBeenCalledWith` (with `vi.fn()`) |

### Step 5 — Clean up DOM after each test

```ts
afterEach(() => {
  document.body.innerHTML = '';
});
```

This prevents state from leaking between tests when using a DOM environment.

### Step 6 — Validate

```bash
pnpm test --run
```

All tests must pass. Fix type errors in tests the same way you would in production code.

---

## DOM / Custom Element Testing Patterns

### Building a form helper

```ts
function buildForm(html: string): HTMLFormElement {
  const form = document.createElement('form');
  form.innerHTML = html;
  document.body.appendChild(form);
  return form;
}
```

Always append to `document.body` so `form.elements` resolves correctly.

### Mounting a custom element

```ts
const el = document.createElement('my-element');
el.innerHTML = `<form data-initial-values='{"name":"expected value"}'><input name="name" /></form>`;
document.body.appendChild(el); // triggers connectedCallback
```

### Testing form.reset()

Because `form.reset()` restores to `defaultValue` / `defaultChecked`, verify the implementation sets those properties — not just `.value`.

```ts
it('restores the initial value after reset', () => {
  // Setup...
  input.value = 'changed';
  form.reset();
  expect(input.value).toBe('expected value'); // proves defaultValue was set correctly
});
```

### Narrowing `form.elements.namedItem`

```ts
function getInput(form: HTMLFormElement, name: string): HTMLInputElement {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLInputElement)) throw new Error(`input[name="${name}"] not found`);
  return el;
}

function getSelect(form: HTMLFormElement, name: string): HTMLSelectElement {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLSelectElement)) throw new Error(`select[name="${name}"] not found`);
  return el;
}
```

---

## Mocking Patterns

### Mock a module function

```ts
import { vi, expect } from 'vitest';
import * as utils from '../utils';

vi.spyOn(utils, 'toFieldValue').mockReturnValue('mocked');
// ... run code that calls toFieldValue ...
expect(utils.toFieldValue).toHaveBeenCalledWith(42);
```

### Mock a timer

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('debounces the handler', () => {
  const fn = vi.fn();
  debounce(fn, 500);
  vi.advanceTimersByTime(499);
  expect(fn).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledOnce();
});
```

### Spy on a method without changing it

```ts
const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code that should log ...
expect(spy).toHaveBeenCalledWith(expect.stringContaining('invalid'));
spy.mockRestore();
```

---

## Coverage Checklist

Before marking tests done, verify every exported symbol has coverage for:

- [ ] Typical/expected inputs (happy path)
- [ ] `null` / `undefined` inputs
- [ ] Empty string / empty array / empty object
- [ ] Boolean extremes (`true` / `false`)
- [ ] Numeric edge cases (0, negative, float) if applicable
- [ ] Object vs. array vs. primitive type dispatch
- [ ] Lifecycle entry/exit for classes (constructor, connectedCallback, disconnectedCallback, reset)
- [ ] Side-effect absence when input is invalid/missing
- [ ] State is restored after reset/cleanup

---

## Vitest Config Reference

### Production-grade `vitest.config.ts`

Install required packages first:

```bash
pnpm add -D vitest happy-dom @vitest/coverage-v8
```

Full config — mirrors tsconfig path aliases, enables V8 coverage, verbose reporter, and 80% thresholds:

```ts
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirror every path alias from tsconfig.json so imports resolve in tests.
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@layouts':    fileURLToPath(new URL('./src/layouts',    import.meta.url)),
      '@web-components': fileURLToPath(new URL('./src/web-components', import.meta.url)),
      '@utils':      fileURLToPath(new URL('./src/share/utils', import.meta.url)),
      // Add any additional aliases your tsconfig defines.
    },
  },
  test: {
    environment: 'happy-dom',              // Fast DOM + custom-elements support
    include: ['src/**/*.{test,spec}.ts'],  // Only test files — no accidental picks
    reporters: ['verbose'],                // Show every test name, not just counts
    coverage: {
      provider: 'v8',                      // Fastest; no instrumentation overhead
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'html', 'lcov'], // text = terminal, html = browser, lcov = CI
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   80,
        statements: 80,
      },
    },
  },
});
```

### package.json scripts

```json
"test":          "vitest",
"test:watch":    "vitest --watch",
"test:coverage": "vitest --run --coverage"
```

- `pnpm test` — watch mode during development
- `pnpm test:watch` — explicit watch mode (alias)
- `pnpm test --run` — single run (CI / pre-commit)
- `pnpm test:coverage` — single run + coverage report

### Key decisions explained

| Decision | Rationale |
|---|---|
| `happy-dom` over `jsdom` | ~3× faster startup; full custom-elements lifecycle support |
| `provider: 'v8'` over `istanbul` | No code transformation; lower overhead; accurate branch tracking |
| `lcov` reporter | Compatible with GitHub Actions coverage summaries and Codecov |
| Explicit `include` glob | Prevents Vitest picking up non-test `.ts` files and slowing the run |
| Path aliases in `resolve.alias` | Tests can use `@components/Button` the same way source files do |
| 80% thresholds | Catches gaps without blocking development; raise project-by-project |

Do **not** add `globals: true` — always import `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` explicitly. This keeps tests self-documenting and avoids IDE "undeclared global" warnings.

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Fix |
|---|---|
| `as any` or `as unknown as T` in tests | Use `instanceof` narrowing or helper getter functions |
| Testing implementation details (private state) | Test observable output only |
| Multiple unrelated assertions in one `it` | Split into separate `it` blocks |
| Shared mutable state between tests (module-level) | Use `beforeEach` to reset state |
| Forgetting `afterEach(() => document.body.innerHTML = '')` | Always clean DOM after each test |
| `toBeTruthy()` when you mean `toBe(true)` | Use `toBe(true)` for boolean assertions |
| Ignoring async — not awaiting Promises | Always `await` async calls; mark `it` as `async` |
| Hand-rolling test DOM instead of real element attributes | Prefer `element.setAttribute(...)` / HTML strings for realistic test inputs |
