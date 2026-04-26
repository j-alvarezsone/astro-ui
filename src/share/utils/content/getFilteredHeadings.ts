import type { MarkdownHeading } from 'astro';

/**
 * Checks whether an unknown value is a valid `MarkdownHeading` object.
 *
 * @param value - The value to test.
 * @returns `true` when `value` has the `depth`, `slug`, and `text` fields
 *   expected by `MarkdownHeading`.
 */
function isMarkdownHeading(value: unknown): value is MarkdownHeading {
  return (
    typeof value === 'object' &&
    value !== null &&
    'depth' in value &&
    typeof (value as Record<string, unknown>).depth === 'number' &&
    'slug' in value &&
    typeof (value as Record<string, unknown>).slug === 'string' &&
    'text' in value &&
    typeof (value as Record<string, unknown>).text === 'string'
  );
}

/**
 * Extracts and filters headings from an Astro `render()` result, keeping only
 * headings within the specified depth range.
 *
 * @param rendered - The object returned by `render()` from `astro:content`.
 * @param minDepth - The minimum heading depth to include (default: `2`).
 * @param maxDepth - The maximum heading depth to include (default: `3`).
 * @returns An array of `MarkdownHeading` objects within the depth range, or an
 *   empty array when the rendered result contains no headings.
 * @example
 * const rendered = await render(guide);
 * const headings = getFilteredHeadings(rendered);
 * // → [{ depth: 2, slug: 'usage', text: 'Usage' }, ...]
 */
export function getFilteredHeadings(
  rendered: object,
  minDepth = 2,
  maxDepth = 3,
): MarkdownHeading[] {
  if (!('headings' in rendered) || !Array.isArray(rendered.headings)) {
    return [];
  }

  return rendered.headings
    .filter(isMarkdownHeading)
    .filter((heading) => heading.depth >= minDepth && heading.depth <= maxDepth);
}
