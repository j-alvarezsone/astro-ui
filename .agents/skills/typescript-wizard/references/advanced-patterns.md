# Advanced Type Patterns

Use these patterns when basic generic modeling is insufficient.

## Non-Distributive Wrapper

Prevent accidental distribution over unions by wrapping in tuples.

```ts
type IsNever<T> = [T] extends [never] ? true : false;
```

## Union to Intersection

```ts
type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;
```

## Recursive Path Builder with Depth Guard

```ts
type Prev = [never, 0, 1, 2, 3, 4, 5, 6];

type Paths<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in Extract<keyof T, string>]:
          | K
          | (Paths<T[K], Prev[D]> extends infer P ? (P extends string ? `${K}.${P}` : never) : never);
      }[Extract<keyof T, string>]
    : never;
```

## Infer Tuple Head/Tail

```ts
type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : [];
```

## Branded Types for Domain Safety

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
```

## Phantom / Type-State Pattern

Encode state machine transitions at compile time with zero runtime cost. The phantom type parameter is never instantiated — it only exists to track allowed states.

```ts
declare const __state: unique symbol;
type Branded<T, S> = T & { readonly [__state]: S };

declare const Unvalidated: unique symbol;
declare const Validated: unique symbol;

type Form<S> = Branded<{ email: string; age: number }, S>;

function createForm(data: { email: string; age: number }): Form<typeof Unvalidated> {
  return data as Form<typeof Unvalidated>;
}

function validate(form: Form<typeof Unvalidated>): Form<typeof Validated> {
  if (!form.email.includes('@')) throw new Error('Invalid email');
  return form as unknown as Form<typeof Validated>;
}

function submit(form: Form<typeof Validated>): void {
  /* safe */
}

const raw = createForm({ email: 'x@y.com', age: 30 });
// submit(raw); // Error: Unvalidated is not assignable to Validated
submit(validate(raw)); // OK
```

## Variadic Tuple Composition

Type-safe function composition using rest/spread in tuple position.

```ts
type Fn<A, B> = (a: A) => B;

function compose<A, B, C>(f: Fn<B, C>, g: Fn<A, B>): Fn<A, C> {
  return (a) => f(g(a));
}

// Typed pipeline with variadic tuples
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;

// Example: zip two tuples element-wise
type Zip<A extends unknown[], B extends unknown[]> = {
  [K in keyof A]: K extends keyof B ? [A[K], B[K]] : never;
};

type Zipped = Zip<[string, number], [boolean, Date]>;
// [[string, boolean], [number, Date]]
```

## Template Literal Type Parsing

Extract structured parts from string shapes using `infer` inside template literals.

```ts
// Extract route params: '/users/:id/posts/:postId' → 'id' | 'postId'
type ExtractParams<S extends string> = S extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParams<`/${Rest}`>
  : S extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = ExtractParams<'/users/:id/posts/:postId'>;
// 'id' | 'postId'

type RouteArgs<S extends string> = Record<ExtractParams<S>, string>;

function navigate<S extends string>(route: S, params: RouteArgs<S>): string {
  return route.replace(/:([^/]+)/g, (_, k) => params[k as keyof typeof params]);
}

navigate('/users/:id/posts/:postId', { id: '1', postId: '99' }); // OK
// navigate('/users/:id', { id: '1', typo: 'x' }); // Error
```

## Lazy Interface Trick for Recursive Types

When recursive type aliases hit "Type alias circularly references itself", wrapping in an interface breaks the cycle because interfaces are lazily evaluated.

```ts
// Error: Type alias circularly references itself
// type Tree<T> = { value: T; children: Tree<T>[] };

// Fix: use interface (lazy) and extend it
interface Tree<T> {
  value: T;
  children: Tree<T>[];
}

// Works with conditional types too:
type Json = string | number | boolean | null | JsonArray | JsonObject;

interface JsonArray extends Array<Json> {}
interface JsonObject extends Record<string, Json> {}
```

## Practical Rule

Reach for advanced types only when they remove real classes of bugs or simplify many call sites.
