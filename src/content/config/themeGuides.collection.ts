import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro:schema';

export const themeGuides = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/theme-guides',
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().int().nonnegative().default(0),
    updatedAt: z.date().optional(),
  }),
});
