# TypeScript Troubleshooting

## Symptom: Type Instantiation Is Excessively Deep

Fixes:
- Split one recursive type into staged helpers
- Add depth-limited recursion using decrement tuples
- Replace deep distributive conditionals with pre-normalized helpers

## Symptom: Inference Falls Back to `unknown` or `{}`

Fixes:
- Move generic type parameters to function boundaries where values exist
- Add constrained helper wrappers to anchor inference
- Avoid broad `T extends object` when key-level constraints are required

## Symptom: Widened Literals (`string` instead of specific values)

Fixes:
- Use `as const` for literals
- Use `satisfies` instead of broad annotation to preserve specificity
- Keep object construction close to usage when possible

## Symptom: Overloads Become Fragile

Fixes:
- Replace many overloads with a single generic signature plus conditional return type
- Model variant behavior with discriminated unions
- Add explicit helper functions for advanced call paths

## Symptom: Unsafe Type Assertions Growing Over Time

Fixes:
- Replace assertion chains with type guards and parser/validator boundaries
- Keep untrusted input as `unknown` until narrowed
- Export validated domain types from one module to reduce repeated assertions

## Quick Validation Checklist

- Run `pnpm run type:check`
- Run `pnpm run lint` for lint-affected files
- Add/keep `@ts-expect-error` checks where negative type behavior is intentional
