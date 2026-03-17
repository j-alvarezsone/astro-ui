# Copilot Instructions for Astro + Vue UI Component Library

## Project Overview

This is a modern UI component library built with Astro and Vue.js, focusing on clean architecture, TypeScript safety, and reusable components.

## Goals

- **Reusability**: Create components that can be used across different projects and frameworks
- **Performance**: Leverage Astro's server-side rendering and partial hydration for optimal loading speeds
- **Developer Experience**: Provide excellent TypeScript support and clear APIs
- **Accessibility**: Ensure all components meet WCAG guidelines and support assistive technologies
- **Maintainability**: Follow clean architecture principles for long-term codebase health
- **Cross-Framework Compatibility**: Use web components for framework-agnostic solutions
- **Design System Integration**: Support design tokens and consistent theming

## Architecture Principles

### Clean Code Architecture

```
src/
├── components/         # Astro components (.astro)
├── layouts/            # Layout components
├── pages/              # Astro pages
├── web-components/     # Custom web components (.ts)
├── share/types/        # Shared TypeScript types
└── assets/             # Styles and static assets
    └── css/
        ├── main.css    # Global styles
        └── tokens.css  # Design tokens
```

### Component Architecture

1. **Astro Components (.astro)** - Server-rendered components with minimal client-side JS
2. **Vue Components (.vue)** - Interactive client-side components
3. **Web Components (.ts)** - Custom elements for cross-framework compatibility
4. **Types** - Shared TypeScript definitions

## Astro Best Practices

### Component Islands & Partial Hydration
- Use `client:*` directives strategically to minimize JavaScript bundle size
- Prefer `client:load` for above-the-fold interactive components
- Use `client:visible` for components below the fold
- Use `client:idle` for non-critical interactive elements
- Only hydrate components that require interactivity

```astro
---
// Counter.astro - Interactive component
import Counter from './Counter.vue';
---
<!-- Only hydrate when component becomes visible -->
<Counter client:visible count={0} />
```

### Performance Optimization
- Leverage HTML streaming for faster page loads
- Move async operations to separate components to avoid blocking rendering
- Use async/await for clean data fetching patterns
- Prefer server-side rendering for initial content

```astro
---
// ✅ Good - Clean async data fetching with TypeScript types
interface User {
  id: string;
  name: string;
}

let users: User[] = [];
let error: string | null = null;

try {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  users = (await response.json()) as User[];
} catch (err: unknown) {
  if (err instanceof Error) {
    error = err.message;
  } else {
    error = 'An unknown error occurred';
  }
}
---
<div>
  <h1>Users</h1>
  {error ? (
    <p class="error">Error loading users: {error}</p>
  ) : (
    users.map(user => <p>{user.name}</p>)
  )}
</div>
```

### Astro Actions (Server-Side Form Handling)
- Use `defineAction()` for type-safe server-side form processing
- Handle validation with Zod schemas
- Implement proper error handling with `ActionError`
- Use `getActionResult()` for form error display

```ts

// src/actions/newsletter.ts
import { z } from 'astro/zod';
import { ActionError, type ActionAPIContext, defineAction } from 'astro:actions';

export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const addNewsLetter = defineAction({
  accept: 'form',
  input: newsletterSchema,
  handler: _newsletterHandler,
});

export async function _newsletterHandler(
  input: NewsletterInput,
  context: ActionAPIContext
) {
  try {
    await addToNewsletter(input.email);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ActionError) {
      throw error;
    }
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to subscribe to newsletter',
    });
  }
}

// src/actions/index.ts
import { addNewsLetter } from './newsletter.handler';

export const server = {
  newsletter: addNewsLetter, // key should reflect the domain, e.g. account, auth, etc.
};
```

### Server Endpoints (API Routes)
- Create type-safe API endpoints in `src/pages/api/`
- Use proper HTTP status codes and error responses
- Validate request data before processing
- Support both GET and POST methods as needed

```ts
// src/pages/api/users.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const users = await getUsers();
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response('Internal Server Error', { status: 500 });
  }
};
```

### Content Collections
- Organize content in `src/content/` with proper schema validation
- Use TypeScript for content type safety
- Leverage frontmatter validation with Zod schemas
- Implement proper content querying patterns

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

### Live Content Collections (Astro 6+)

Live Content Collections are now stable in Astro 6, bringing request-time content fetching to Astro’s unified content layer. Use `defineLiveCollection()` to fetch content at request time—no rebuild required. This is ideal for CMS, API, or editorial content that must update instantly.

```ts
// src/live.config.ts
import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { cmsLoader } from './loaders/my-cms';

const updates = defineLiveCollection({
  loader: cmsLoader({ apiKey: process.env.MY_API_KEY }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    excerpt: z.string(),
    publishedAt: z.coerce.date(),
  }),
});

export const collections = { updates };
```

### View Transitions
- Use `@astrojs/vue` with view transitions for smoother navigation
- Apply `transition:persist` for maintaining component state
- Use semantic transition names for better UX
- Test transitions across different pages and components

### Static vs On-Demand Rendering
- Default to static rendering (`prerender: true`) for maximum performance
- Use on-demand rendering (`prerender: false`) only for dynamic content
- Consider hybrid approach: mostly static with selective dynamic pages
- Always add appropriate server adapter for SSR functionality

### Modern Astro Features
- Enable experimental SVG optimization for better performance
- Use astro:db for type-safe database operations
- Leverage server islands for selective hydration
- Implement proper error boundaries and fallback UI

### Built-in Fonts API (Astro 6+)

Astro 6 adds a built-in Fonts API that simplifies font management and optimization. Configure your fonts from local files or providers like Google and Fontsource, and Astro will handle downloading, caching, generating fallbacks, and adding preload links for you.

**astro.config.mjs**
```ts
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  fonts: [
    {
      name: 'Roboto',
      cssVariable: '--font-roboto',
      provider: fontProviders.fontsource(),
    },
  ],
});
```

**src/components/Head.astro**
```astro
---
import { Font } from 'astro:assets';
---

<Font cssVariable="--font-roboto" preload />
<style is:global>
  body {
    font-family: var(--font-roboto);
  }
</style>
```

Astro will automatically download the font files, generate optimized fallback fonts, and add the correct preload hints for best-practice font loading and privacy.

## Code Style Guidelines

### TypeScript Rules
- Use strict TypeScript configuration (`astro/tsconfigs/strict`)
- Avoid `any` types - prefer `unknown` and type guards
- Use `import type` for type-only imports
- Handle promises explicitly (no floating promises)
- Use typed error handling with `unknown` in catch blocks

```ts
// ✅ Good
try {
  await someOperation();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}

// ❌ Avoid
try {
  await someOperation();
} catch (err: any) {
  console.error(err.message);
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `Button.astro`, `Modal.vue`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase (no `I` prefix)

### Import Organization
```ts
// 1. External packages
import { defineComponent } from 'vue';
import type { ComponentProps } from 'astro';

// 2. Aliased imports (project paths)
import Button from '@components/Button.astro';
import type { ThemeVariant } from '@/types';

// 3. Relative imports
import './component.css';
```

## Component Development Guidelines

### Astro Components
- Use for server-side rendered content
- Minimize client-side JavaScript
- Leverage Astro's component islands pattern
- Use TypeScript for props interfaces

```astro
---
// Component.astro
interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const { variant = 'primary', size = 'md', disabled = false } = Astro.props;
---

<button
  class={`btn btn--${variant} btn--${size}`}
  disabled={disabled}
  {...Astro.props}
>
  <slot />
</button>
```

### Vue Components
- Use for interactive components requiring reactivity
- Follow Vue 3 Composition API patterns
- Use `<script setup>` syntax
- Define clear prop interfaces

```vue
<!-- InteractiveButton.vue -->
<script setup lang="ts">
interface Props {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  loading: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :class="`btn btn--${props.variant}`"
    :disabled="props.loading"
    @click="emit('click', $event)"
  >
    <span v-if="loading">Loading...</span>
    <span v-else>{{ props.label }}</span>
  </button>
</template>
```

### Web Components
- Use for cross-framework compatibility
- Implement proper lifecycle methods
- Follow web standards

```ts
// ripple.web.ts
export class RippleElement extends HTMLElement {
  private boundCreateRipple = this.createRipple.bind(this);

  connectedCallback(): void {
    this.addEventListener('click', this.boundCreateRipple);
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.boundCreateRipple);
  }

  private createRipple(event: MouseEvent): void {
    // Implementation
  }
}

customElements.define('ui-ripple', RippleElement);
```

## Styling Guidelines

### CSS Architecture
- Use CSS custom properties (design tokens)
- Follow BEM methodology for class names
- Leverage Astro's scoped styles
- Use modern CSS features (Grid, Flexbox, logical properties)

```css
/* tokens.css */
:root {
  --color-primary: hsl(220 100% 50%);
  --color-secondary: hsl(280 100% 60%);
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
}

/* Component styles */
.btn {
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--secondary {
  background-color: var(--color-secondary);
  color: white;
}
```

## Development Workflow

### Commands
- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm run lint` - Run linter
- `pnpm run lint:fix` - Auto-fix linting issues
- `pnpm run type:check` - TypeScript validation

### Code Quality
- Run linter before commits (pre-commit hooks configured)
- All components must pass TypeScript checks
- Use semantic commit messages
- Test components manually in development

## Component API Design

### Props Interface
```ts
interface ButtonProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
}
```

### Event Handling
- Use semantic event names
- Provide proper TypeScript event types
- Support both Vue and Astro event patterns

## File Organization

```
src/components/
├── Button/
│   ├── Button.astro        # Server-rendered button
│   ├── ButtonVue.vue       # Interactive button
│   └── button.css          # Button styles
├── Modal/
│   ├── Modal.astro
│   ├── ModalVue.vue
│   └── modal.css
└── typography/
    ├── Heading.astro
    ├── Text.astro
    └── typography.css
```

## Testing Guidelines

- Prefer manual testing during development
- When adding automated tests, use Vitest
- Test component props, events, and accessibility
- Create visual regression tests for complex components

## Accessibility

- Use semantic HTML elements
- Provide ARIA labels and roles
- Ensure keyboard navigation
- Test with screen readers
- Maintain proper color contrast ratios

## Performance

- Minimize client-side JavaScript
- Use Astro's partial hydration
- Optimize images and assets
- Leverage CSS for animations when possible
- Use web components for cross-framework code sharing

## Error Handling

```ts
// ✅ Proper error handling
function processData(data: unknown): Result {
  try {
    if (!isValidData(data)) {
      throw new Error('Invalid data format');
    }
    return { success: true, data: transformData(data) };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message, cause: err.cause };
    }
    return { success: false, error: 'Unknown error occurred', cause: err };
  }
}
```

## Documentation

- Document component props and their types
- Provide usage examples
- Include accessibility guidelines
- Maintain README files for complex components

---

Follow these guidelines to maintain consistency, quality, and maintainability of the UI component library.
