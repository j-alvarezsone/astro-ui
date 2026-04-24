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
 *
 * @param blockClass - The component block class (for example `chips`).
 * @param slotNames - Pass-through slot names to convert.
 * @returns Slot descriptors with `name` and CSS `selector`.
 * @example
 * const slots = createComponentSlots('chips', ['root', 'removeIcon']);
 * // [
 * //   { name: 'root', selector: '.chips' },
 * //   { name: 'removeIcon', selector: '.chips__remove-icon' },
 * // ]
 */
export function createComponentSlots(
  blockClass: string,
  slotNames: readonly string[],
): ComponentSlot[] {
  return slotNames.map((name) => ({
    name,
    selector: name === 'root' ? `.${blockClass}` : `.${blockClass}__${toKebabCase(name)}`,
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
