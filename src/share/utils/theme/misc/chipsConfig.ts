import type { ChipsStyleConfig } from '@/types/theme/misc/chips';

/**
 * Converts a `ChipsStyleConfig` into CSS custom-property declarations for the chips component.
 *
 * @param config - Chips style config with background, border, color, and active-state overrides.
 * @returns A semicolon-separated CSS declaration string, or `undefined` when no values are present.
 *
 * @example
 * const vars = createChipsStyleVars({
 *   backgroundColor: '#fff7ed',
 *   borderColor: '#fdba74',
 *   activeBackgroundColor: '#fb923c',
 *   activeColor: '#fff',
 * });
 * // '--chips-background-color: #fff7ed; --chips-border-color: #fdba74; --chips-active-background-color: #fb923c; --chips-active-color: #fff'
 */
export function createChipsStyleVars(config: ChipsStyleConfig | undefined): string | undefined {
  if (!config) {
    return undefined;
  }

  const entries: [string, string | undefined][] = [
    ['--chips-background-color', config.backgroundColor],
    ['--chips-border-color', config.borderColor],
    ['--chips-color', config.color],
    ['--chips-active-background-color', config.activeBackgroundColor],
    ['--chips-active-border-color', config.activeBorderColor],
    ['--chips-active-color', config.activeColor],
  ];

  const declarations = entries
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .map(([property, value]) => `${property}: ${value}`);

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}
