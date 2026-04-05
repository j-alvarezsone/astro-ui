---
name: typescript-wizard
description: Senior-level TypeScript wizard skill for complex type-system tasks, hard inference issues, API design, and compile-time guarantees. Use when asked to solve advanced generics, conditional/mapped/template-literal types, recursive types, type performance bottlenecks, strict-mode migrations, or deep TypeScript debugging.
---

# TypeScript Wizard

Expert workflow for solving high-complexity TypeScript tasks with predictable, maintainable, and performant type design.

## When to Use This Skill

- Solving complex type-level logic with generics, conditional, mapped, and template literal types
- Designing type-safe SDKs, framework APIs, config schemas, and utility libraries
- Debugging inference failures, widening/narrowing mistakes, and overload resolution issues
- Eliminating unsafe `any` usage and reducing assertion-heavy code
- Migrating codebases toward stricter TypeScript guarantees
- Improving type-check performance for deeply recursive or distributive types

## Prerequisites

- TypeScript strict mode should remain enabled unless the user explicitly requests otherwise
- Prefer minimal runtime impact for type-system improvements
- Validate with project checks after edits:
  - `pnpm run type:check`
  - `pnpm run lint` (if lint-impacting files changed)

## Core Working Rules

1. Encode business invariants in types first, then simplify ergonomics with helpers.
2. Prefer `unknown` over `any`; narrow with user-defined type guards.
3. Favor composable utility types over one massive type expression.
4. Use `satisfies` for object validation without losing literal precision.
5. Keep public API types stable and explicit; hide complex internals behind aliases.
6. Avoid type cleverness that harms readability unless it prevents real bugs.
7. **Never use `enum`.** Use `as const` objects and derive types with `ValueOf<T>` / `Keyof<T>` helpers (see pattern 4 below).

## Step-by-Step Workflow

1. Define target guarantees.
- Write down the exact constraints the type must enforce.
- Identify what must fail at compile time.

2. Build a minimal type model.
- Start from `type` aliases and small generic helpers.
- Add constraints (`extends`) only where they increase signal.

3. Introduce inference control.
- Use helper wrappers to guide inference.
- Prefer parameter-position inference over explicit generic arguments when possible.

4. Add compile-time tests.
- Create local type assertions to verify expected and rejected cases.
- Use `@ts-expect-error` for deliberate negative tests.

5. Optimize type performance.
- Break recursive/distributive types into stages.
- Add depth limits or early exits for pathological unions.

6. Validate and refactor for maintainability.
- Keep names intention-revealing.
- Export ergonomic surface types and keep internals private.

## High-Value Patterns

### 1) Constraint-first generic API

```ts
export type KeyOfType<T, Value> = {
  [K in keyof T]-?: T[K] extends Value ? K : never;
}[keyof T];

export function pickByType<T extends object, V>(
  obj: T,
  keys: KeyOfType<T, V>[]
): Pick<T, KeyOfType<T, V>> {
  const out = {} as Pick<T, KeyOfType<T, V>>;
  for (const key of keys) {
    out[key] = obj[key];
  }
  return out;
}
```

### 2) Preserve literals with `satisfies`

```ts
const routes = {
  home: '/',
  settings: '/settings',
  account: '/account',
} as const satisfies Record<string, `/${string}`>;
```

### 3) Exhaustive checking

```ts
type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; data: string }
  | { kind: 'error'; message: string };

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${String(x)}`);
}

function render(state: State): string {
  switch (state.kind) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading';
    case 'done':
      return state.data;
    case 'error':
      return state.message;
    default:
      return assertNever(state);
  }
}
```

### 4) `const` objects instead of enums

`enum` has confusing runtime semantics, emits extra JavaScript, and interoperates poorly with mapped/template-literal types. Always prefer `as const` objects.

**Shared utility types (add once to `src/share/types/index.ts` or equivalent):**

```ts
export type ValueOf<T> = T[keyof T];
export type Keyof<T> = keyof T;
```

**Pattern:**

```ts
// Instead of:
enum FontWeight { Bold = 'heading__font-bold', Semibold = 'heading__font-semibold' }

// Use:
const fontWeights = {
  bold: 'heading__font-bold',
  semibold: 'heading__font-semibold',
  medium: 'heading__font-medium',
  light: 'heading__font-light',
} as const;

type FontWeightKey = Keyof<typeof fontWeights>;   // 'bold' | 'semibold' | 'medium' | 'light'
type FontWeightValue = ValueOf<typeof fontWeights>; // 'heading__font-bold' | ...
```

Benefits:
- Zero extra runtime output vs `enum`
- Full literal-type preservation without `as const` casting at use-site
- Works naturally with mapped types, `keyof`, and template literals
- Object can be iterated at runtime (`Object.values(fontWeights)`)

### 5) `const` type parameters — infer literals without `as const` at call site

Available since TypeScript 5.0. Lets callers omit `as const` while still getting narrow literal types.

```ts
// Without const type param — T is widened to string[]
function createTags<T extends string[]>(tags: T): T { return tags; }
const a = createTags(['a', 'b']); // string[]

// With const type param — T is inferred as readonly ['a', 'b']
function createTags<const T extends readonly string[]>(tags: T): T { return tags; }
const b = createTags(['a', 'b']); // readonly ['a', 'b']
```

Use this on any helper that builds or validates a tuple/object literal.

### 6) `NoInfer<T>` — prevent inference leaking through a position

Available since TypeScript 5.4. Stops TypeScript from using a parameter to drive generic inference, so the inferred type comes only from other positions.

```ts
// Without NoInfer — defaultValue widens T to string | number
function withDefault<T>(value: T, defaultValue: T): T {
  return value ?? defaultValue;
}
withDefault(42, 'oops'); // T = string | number — no error

// With NoInfer — T inferred from value only; defaultValue must conform
function withDefault<T>(value: T, defaultValue: NoInfer<T>): T {
  return value ?? defaultValue;
}
withDefault(42, 'oops'); // Error: string not assignable to number
```

### 7) Assertion functions — narrowing with side effects

Use `asserts x is T` when a function validates and throws instead of returning `boolean`. Keeps narrowing active after the call without branching.

```ts
function assertDefined<T>(val: T, label: string): asserts val is NonNullable<T> {
  if (val === null || val === undefined) {
    throw new Error(`${label} must not be null or undefined`);
  }
}

const userId: string | undefined = getParam('userId');
assertDefined(userId, 'userId');
// userId is now narrowed to string for the rest of the scope
```

## Type Debugging Playbook

1. Isolate the failing type into a local alias.
2. Reduce unions and generics to a minimal reproducible case.
3. Probe intermediate types with helper aliases.
4. Replace broad constraints (`extends object`) with narrower structural contracts.
5. Convert overloaded signatures to single-signature generic forms when possible.
6. If inference fails repeatedly, introduce explicit helper functions to anchor inference.

See [advanced patterns](./references/advanced-patterns.md) and [troubleshooting guide](./references/troubleshooting.md).

## Done Criteria

- Type behavior matches both positive and negative compile-time expectations.
- Public API is understandable without reading internal helper types.
- No unnecessary `any`/unsafe assertions introduced.
- Type checks pass and performance remains acceptable.
