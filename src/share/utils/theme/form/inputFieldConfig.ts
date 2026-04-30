import type { InputFieldStyleConfig } from '@/types/theme/form/inputField';

/**
 * Converts shared field-shell style config into CSS custom-property declarations.
 *
 * @param config - Shared field-shell config for root, wrapper, label, icon, help, and error states.
 * @returns A semicolon-separated CSS declaration string, or `undefined` when no values are present.
 *
 * @example
 * const vars = createInputFieldStyleVars({
 *   wrapper: { backgroundColor: 'pink' },
 *   label: { activeColor: 'navy' },
 * });
 * // '--input-field-wrapper-background: pink; --input-field-label-active-color: navy'
 */
export function createInputFieldStyleVars(config: InputFieldStyleConfig | undefined): string | undefined {
  if (!config) {
    return undefined;
  }

  const entries = [
    ['--input-field-root-gap', config.root?.gap],
    ['--input-field-wrapper-gap', config.wrapper?.gap],
    ['--input-field-wrapper-background', config.wrapper?.backgroundColor],
    ['--input-field-wrapper-border-color', config.wrapper?.borderColor],
    ['--input-field-wrapper-hover-border-color', config.wrapper?.hoverBorderColor],
    ['--input-field-wrapper-focus-border-color', config.wrapper?.focusBorderColor],
    ['--input-field-wrapper-focus-ring-color', config.wrapper?.focusRingColor],
    ['--input-field-wrapper-focus-ring-width', config.wrapper?.focusRingWidth],
    ['--input-field-wrapper-error-border-color', config.wrapper?.errorBorderColor],
    ['--input-field-wrapper-disabled-background', config.wrapper?.disabledBackgroundColor],
    ['--input-field-wrapper-border-radius', config.wrapper?.borderRadius],
    ['--input-field-wrapper-padding-inline', config.wrapper?.paddingInline],
    ['--input-field-label-color', config.label?.color],
    ['--input-field-label-default-color', config.label?.defaultColor],
    ['--input-field-label-active-color', config.label?.activeColor],
    ['--input-field-label-background', config.label?.backgroundColor],
    ['--input-field-label-required-color', config.label?.requiredColor],
    ['--input-field-label-optional-color', config.label?.optionalColor],
    ['--input-field-icon-color', config.icon?.color],
    ['--input-field-icon-disabled-opacity', config.icon?.disabledOpacity],
    ['--input-field-help-color', config.helpText?.color],
    ['--input-field-error-color', config.errorText?.color],
  ] as const;

  const declarations = entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([property, value]) => `${property}: ${String(value)}`);

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}