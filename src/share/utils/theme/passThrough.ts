import type { PassThroughAttributes } from '@/types/theme/form/shared';

type PassThroughSource = Record<string, unknown> & {
  class?: unknown;
  style?: unknown;
};

/**
 * Returns all attributes except `class` and `style` from a pass-through object.
 *
 * @param source - Pass-through source object.
 * @returns Attributes excluding `class` and `style`.
 *
 * @example
 * const attrs = stripClassAndStyle({ class: 'x', style: 'color:red', id: 'field' });
 * // { id: 'field' }
 */
function stripClassAndStyle(source: PassThroughSource | undefined): Record<string, unknown> {
  if (!source) {
    return {};
  }

  const { class: _class, style: _style, ...rest } = source;
  return rest;
}

/**
 * Trims a CSS style string and removes trailing semicolons.
 *
 * @param style - Raw style string.
 * @returns Normalized style string, or `undefined` when input is empty.
 *
 * @example
 * const value = normalizeStyle(' color: red;;; ');
 * // 'color: red'
 */
function normalizeStyle(style: string | undefined): string | undefined {
  if (!style) {
    return undefined;
  }

  return style.trim().replace(/;+$/u, '');
}

/**
 * Merges two CSS style strings into one normalized declaration string.
 *
 * @param baseStyle - Base style string.
 * @param overrideStyle - Override style string appended after base.
 * @returns Merged style string, or `undefined` when both are empty.
 *
 * @example
 * const merged = mergeStyle('color: red;', 'background: blue;');
 * // 'color: red; background: blue'
 */
function mergeStyle(baseStyle: string | undefined, overrideStyle: string | undefined): string | undefined {
  const normalizedBase = normalizeStyle(baseStyle);
  const normalizedOverride = normalizeStyle(overrideStyle);

  if (normalizedBase && normalizedOverride) {
    return `${normalizedBase}; ${normalizedOverride}`;
  }

  return normalizedBase ?? normalizedOverride;
}

/**
 * Converts a style object key to a CSS property name.
 *
 * @param property - Style key in camelCase or CSS variable form.
 * @returns CSS property name in kebab-case (or unchanged for CSS variables).
 *
 * @example
 * const cssName = toCssPropertyName('backgroundColor');
 * // 'background-color'
 */
function toCssPropertyName(property: string): string {
  if (property.startsWith('--')) {
    return property;
  }

  return property.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}

/**
 * Converts a style object to CSS declaration text.
 *
 * @param value - Style object with string/number values.
 * @returns Semicolon-separated CSS declarations, or `undefined` when object is empty.
 *
 * @example
 * const cssText = objectStyleToCssText({ backgroundColor: 'white', '--gap': '8px' });
 * // 'background-color: white; --gap: 8px'
 */
function objectStyleToCssText(value: Record<string, string | number>): string | undefined {
  const declarations = Object.entries(value).map(
    ([property, styleValue]) => `${toCssPropertyName(property)}: ${styleValue}`,
  );

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}

/**
 * Normalizes supported class value input into a string array.
 *
 * @param value - Class value as unknown input.
 * @returns Array of class names, or `undefined` when unsupported/empty.
 *
 * @example
 * const classes = normalizeClassValue(['base', 'active']);
 * // ['base', 'active']
 */
function normalizeClassValue(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    const normalized = value.filter((entry): entry is string => typeof entry === 'string');
    return normalized.length > 0 ? normalized : undefined;
  }

  return undefined;
}

/**
 * Normalizes style input into CSS declaration text.
 * Supports string and object style values.
 *
 * @param value - Style value as unknown input.
 * @returns CSS declaration text, or `undefined` when unsupported/empty.
 *
 * @example
 * const style = normalizeStyleValue({ backgroundColor: 'white' });
 * // 'background-color: white'
 */
function normalizeStyleValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const normalized: Record<string, string | number> = {};

    for (const [key, styleValue] of Object.entries(value)) {
      if (typeof styleValue === 'string' || typeof styleValue === 'number') {
        normalized[key] = styleValue;
      }
    }

    return objectStyleToCssText(normalized);
  }

  return undefined;
}

/**
 * Merges two pass-through attribute objects.
 * Class values are concatenated, style values are normalized and merged,
 * and non-class/style attributes from `override` take precedence.
 *
 * @param base - Base pass-through attributes.
 * @param override - Override pass-through attributes.
 * @returns Merged attributes, or `undefined` when both inputs are empty.
 *
 * @example
 * const merged = mergePassThroughAttributes(
 *   { class: 'base', style: 'color: red;', 'data-size': 'md' },
 *   { class: ['override'], style: 'background: blue;', 'data-size': 'lg' },
 * );
 * // { class: ['base', 'override'], style: 'color: red; background: blue', 'data-size': 'lg' }
 */
export function mergePassThroughAttributes(
  base: PassThroughSource | undefined,
  override: PassThroughSource | undefined,
): PassThroughAttributes | undefined {
  if (!base && !override) {
    return undefined;
  }

  const merged: PassThroughAttributes = {
    ...stripClassAndStyle(base),
    ...stripClassAndStyle(override),
  };

  const baseClass = normalizeClassValue(base?.class);
  const overrideClass = normalizeClassValue(override?.class);
  const mergedClass: string[] = [];

  if (baseClass) {
    mergedClass.push(...baseClass);
  }

  if (overrideClass) {
    mergedClass.push(...overrideClass);
  }

  const baseStyle = normalizeStyleValue(base?.style);
  const overrideStyle = normalizeStyleValue(override?.style);
  const mergedStyle = mergeStyle(baseStyle, overrideStyle);

  if (mergedClass.length > 0) {
    merged.class = mergedClass;
  } else {
    delete merged.class;
  }

  if (mergedStyle !== undefined) {
    merged.style = mergedStyle;
  } else {
    delete merged.style;
  }

  return merged;
}

/**
 * Splits a pass-through attribute object into class and remaining attributes.
 * Use in component frontmatter to bind `class:list` and spread attributes separately.
 *
 * @param attributes - Pass-through attributes that may include `class` and arbitrary HTML attributes.
 * @returns An object with `className` and the remaining `attributes` (or `undefined` when empty).
 *
 * @example
 * const result = splitPassThroughAttributes({ class: ['foo'], id: 'field-1' });
 * // { className: ['foo'], attributes: { id: 'field-1' } }
 */
export function splitPassThroughAttributes<T extends PassThroughAttributes | undefined>(attributes: T): {
  className: PassThroughAttributes['class'];
  attributes: Omit<PassThroughAttributes, 'class'> | undefined;
} {
  if (!attributes) {
    return {
      className: undefined,
      attributes: undefined,
    };
  }

  const { class: className, ...rest } = attributes;

  return {
    className,
    attributes: Object.keys(rest).length > 0 ? rest : undefined,
  };
}
