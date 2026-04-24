import type { MarkdownHeading } from 'astro';
import { describe, expect, it } from 'vitest';
import { getFilteredHeadings } from './getFilteredHeadings';

const h = (depth: number, slug: string, text: string): MarkdownHeading => ({ depth, slug, text });

describe('getFilteredHeadings', () => {
  it('returns headings within the default depth range (2–3)', () => {
    const rendered = {
      headings: [h(1, 'title', 'Title'), h(2, 'usage', 'Usage'), h(3, 'api', 'API'), h(4, 'deep', 'Deep')],
    };

    expect(getFilteredHeadings(rendered)).toEqual([h(2, 'usage', 'Usage'), h(3, 'api', 'API')]);
  });

  it('returns an empty array when rendered has no headings property', () => {
    expect(getFilteredHeadings({})).toEqual([]);
  });

  it('returns an empty array when rendered.headings is not an array', () => {
    expect(getFilteredHeadings({ headings: null })).toEqual([]);
    expect(getFilteredHeadings({ headings: 'string' })).toEqual([]);
  });

  it('returns an empty array when no headings match the depth range', () => {
    const rendered = { headings: [h(1, 'h1', 'H1'), h(4, 'h4', 'H4')] };

    expect(getFilteredHeadings(rendered)).toEqual([]);
  });

  it('respects custom minDepth and maxDepth', () => {
    const rendered = {
      headings: [h(1, 'h1', 'H1'), h(2, 'h2', 'H2'), h(3, 'h3', 'H3'), h(4, 'h4', 'H4')],
    };

    expect(getFilteredHeadings(rendered, 1, 2)).toEqual([h(1, 'h1', 'H1'), h(2, 'h2', 'H2')]);
    expect(getFilteredHeadings(rendered, 4, 4)).toEqual([h(4, 'h4', 'H4')]);
  });

  it('returns all headings when minDepth equals maxDepth and matches', () => {
    const rendered = { headings: [h(2, 'a', 'A'), h(2, 'b', 'B'), h(3, 'c', 'C')] };

    expect(getFilteredHeadings(rendered, 2, 2)).toEqual([h(2, 'a', 'A'), h(2, 'b', 'B')]);
  });
});
