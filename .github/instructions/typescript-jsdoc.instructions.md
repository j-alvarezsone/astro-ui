---
description: "Use when creating or updating TypeScript functions to enforce JSDoc completeness."
applyTo: "src/**/*.ts,scripts/**/*.mts"
---

# TypeScript Function JSDoc

When creating a new function, always add full JSDoc.

Minimum required tags:

- `@param` for each function parameter
- `@returns` describing the return value
- `@example` with at least one realistic usage snippet

Additional rules:

- Keep examples short and copy-pasteable.
- Keep descriptions practical and specific to behavior.
- Apply this to exported and non-exported functions unless the function is trivial and immediately obvious.
- For non-trivial logic, use an explicit function signature so TypeScript can clearly understand parameter types and return type.

Signature requirements for non-trivial functions:

- Type every parameter explicitly.
- Add an explicit return type annotation.
- Do not rely only on inferred return types when branching/complex logic can make intent unclear.
