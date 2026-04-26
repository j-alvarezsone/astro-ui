import type { ChipsStyleConfig } from '@/types/theme/misc/chips';

/**
 * Converts a `ChipsStyleConfig` into CSS custom-property declarations for the chips component.
 *
 * @param config - Chips style config with per-part sub-configs for root, image, icon, label, and removeIcon.
 * @returns A semicolon-separated CSS declaration string, or `undefined` when no values are present.
 *
 * @example
 * const vars = createChipsStyleVars({
 *   root: {
 *     backgroundColor: '#fff7ed',
 *     borderColor: '#fdba74',
 *     activeBackgroundColor: '#fb923c',
 *     activeColor: '#fff',
 *     focusRingColor: '#fb923c',
 *     focusRingOverlayColor: 'rgba(251,146,60,0.3)',
 *   },
 *   image: { borderRadius: '4px' },
 * });
 * // '--chips-background-color: #fff7ed; --chips-border-color: #fdba74; --chips-active-background-color: #fb923c; --chips-active-color: #fff; --chips-focus-ring-color: #fb923c; --chips-focus-ring-overlay-color: rgba(251,146,60,0.3); --chips-image-border-radius: 4px'
 */
export function createChipsStyleVars(config: ChipsStyleConfig | undefined): string | undefined {
  if (!config) {
    return undefined;
  }

  const entries: [string, string | undefined][] = [
    ['--chips-background-color', config.root?.backgroundColor],
    ['--chips-border-color', config.root?.borderColor],
    ['--chips-color', config.root?.color],
    ['--chips-border-radius', config.root?.borderRadius],
    ['--chips-active-background-color', config.root?.activeBackgroundColor],
    ['--chips-active-border-color', config.root?.activeBorderColor],
    ['--chips-active-color', config.root?.activeColor],
    ['--chips-focus-ring-color', config.root?.focusRingColor],
    ['--chips-focus-ring-overlay-color', config.root?.focusRingOverlayColor],
    ['--chips-image-border-radius', config.image?.borderRadius],
    ['--chips-icon-color', config.icon?.color],
    ['--chips-label-color', config.label?.color],
    ['--chips-label-font-weight', config.label?.fontWeight],
    ['--chips-label-font-size', config.label?.fontSize],
    ['--chips-remove-icon-color', config.removeIcon?.color],
  ];

  const declarations = entries
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .map(([property, value]) => `${property}: ${value}`);

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}
