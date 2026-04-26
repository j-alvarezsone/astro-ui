import type { InputTextPassThrough, InputTextStyleConfig } from '@/types/theme/form/inputText';
import { mergePassThroughAttributes } from '@utils/theme/passThrough';

/**
 * Merges InputText pass-through maps section by section.
 *
 * @param base - Base pass-through map.
 * @param override - Override pass-through map that takes precedence.
 * @returns A merged pass-through map, or `undefined` when both inputs are empty.
 *
 * @example
 * const merged = mergeInputTextPassThrough(
 *   { wrapper: { class: 'base' } },
 *   { wrapper: { class: 'override', style: 'border-color: red;' } },
 * );
 * // { wrapper: { class: ['base', 'override'], style: 'border-color: red' }, ... }
 */
export function mergeInputTextPassThrough(
  base: InputTextPassThrough | undefined,
  override: InputTextPassThrough | undefined,
): InputTextPassThrough | undefined {
  if (!base && !override) {
    return undefined;
  }

  return {
    root: mergePassThroughAttributes(base?.root, override?.root),
    wrapper: mergePassThroughAttributes(base?.wrapper, override?.wrapper),
    input: mergePassThroughAttributes(base?.input, override?.input),
    label: mergePassThroughAttributes(base?.label, override?.label),
    icon: mergePassThroughAttributes(base?.icon, override?.icon),
    helpText: mergePassThroughAttributes(base?.helpText, override?.helpText),
    errorText: mergePassThroughAttributes(base?.errorText, override?.errorText),
  };
}

/**
 * Converts an InputText-only style config object into CSS custom-property declarations.
 * Shared field shell tokens are emitted by `createInputFieldStyleVars`.
 *
 * @param config - InputText style config for text-control-specific tokens.
 * @returns A semicolon-separated CSS declaration string, or `undefined` when no values are present.
 *
 * @example
 * const vars = createInputTextStyleVars({
 *   input: { color: 'navy', placeholderColor: 'gray' },
 * });
 * // '--input-control-input-color: navy; --input-control-input-placeholder-color: gray'
 */
export function createInputTextStyleVars(config: InputTextStyleConfig | undefined): string | undefined {
  if (!config) {
    return undefined;
  }

  const entries = [
    ['--input-control-input-color', config.input?.color],
    ['--input-control-input-padding-block', config.input?.paddingBlock],
    ['--input-control-input-placeholder-color', config.input?.placeholderColor],
    ['--input-control-input-placeholder-error-color', config.input?.placeholderErrorColor],
    ['--input-control-input-disabled-color', config.input?.disabledColor],
  ] as const;

  const declarations = entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([property, value]) => `${property}: ${String(value)}`);

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}
