export interface ComponentSlot {
  name: string;
  selector: string;
}

/**
 * Converts a component block class and pass-through slot names into slot descriptors
 * for the theme-guide interactive preview.
 *
 * Rules:
 * - `root` maps to `.<blockClass>`
 * - other slots map to `.<blockClass>__<kebab-case-slot-name>`
 * - entries in `selectorOverrides` replace the auto-derived selector for that slot name
 *
 * @param blockClass - The component block class (for example `chips`).
 * @param slotNames - Pass-through slot names to convert.
 * @param selectorOverrides - Optional map of slot name → custom CSS selector for slots
 *   whose actual selector deviates from the standard BEM pattern.
 * @returns Slot descriptors with `name` and CSS `selector`.
 * @example
 * const slots = createComponentSlots('chips', ['root', 'removeIcon']);
 * // [
 * //   { name: 'root', selector: '.chips' },
 * //   { name: 'removeIcon', selector: '.chips__remove-icon' },
 * // ]
 * @example
 * // With overrides for non-standard BEM selectors:
 * const slots = createComponentSlots('input-field', ['root', 'label', 'helpText'], {
 *   label: '.input-label',
 *   helpText: '.input-field__help',
 * });
 * // [
 * //   { name: 'root', selector: '.input-field' },
 * //   { name: 'label', selector: '.input-label' },
 * //   { name: 'helpText', selector: '.input-field__help' },
 * // ]
 */
export function createComponentSlots(
  blockClass: string,
  slotNames: readonly string[],
  selectorOverrides: Readonly<Record<string, string>> = {},
): ComponentSlot[] {
  return slotNames.map((name) => ({
    name,
    selector:
      selectorOverrides[name] ??
      (name === 'root' ? `.${blockClass}` : `.${blockClass}__${toKebabCase(name)}`),
  }));
}

/**
 * Converts a camelCase/PascalCase slot name into kebab-case.
 *
 * @param value - Slot name to convert.
 * @returns Kebab-case name.
 * @example
 * toKebabCase('removeIcon');
 * // 'remove-icon'
 */
function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
