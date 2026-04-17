import type { Maybe } from "@/types/index";

/**
 * Normalizes and merges CSS declaration strings into a single declaration block.
 * Removes empty entries, trims whitespace, and strips trailing semicolons.
 *
 * @param styleVars - Array of CSS declaration strings (or nullable values).
 * @returns A semicolon-separated declaration string, or an empty string when none are valid.
 *
 * @example
 * const declarations = toCssDeclarations([
 *   '--input-text-wrapper-background: pink;',
 *   null,
 *   '  --button-border-color: blue  ',
 * ]);
 * // '--input-text-wrapper-background: pink; --button-border-color: blue'
 */
function toCssDeclarations(styleVars: Maybe<string>[]): string {
  return styleVars
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().replace(/;+$/u, ''))
    .filter((value) => value.length > 0)
    .join('; ');
}

/**
 * Creates a CSS rule from one or many style-variable declaration strings.
 * Empty values are ignored and the remaining declarations are merged.
 *
 * @param styleVars - Array of CSS declaration strings (or nullable values) to merge.
 * @param selector - CSS selector used to scope the generated declarations. Defaults to `':root'`.
 * @returns A CSS rule string when at least one declaration is provided, otherwise `undefined`.
 *
 * @example
 * const css = createThemeCss(
 *   ['--input-text-wrapper-background: pink', '--button-border-color: tomato'],
 *   'html[data-ui-theme="warm"]',
 * );
 * // 'html[data-ui-theme="warm"] { --input-text-wrapper-background: pink; --button-border-color: tomato; }'
 */
export function createThemeCss(
  styleVars: Maybe<string>[],
  selector = ':root',
): string | undefined {
  const declarations = toCssDeclarations(styleVars);

  if (!declarations) {
    return undefined;
  }

  return `${selector} { ${declarations}; }`;
}
