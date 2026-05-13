import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const queryGuides = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/query-guides',
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().int().nonnegative().default(0),
    updatedAt: z.date().optional(),
  }),
});
