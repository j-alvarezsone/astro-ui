import { createComponentThemeResolver, createComponentsThemeCss } from '@utils/theme/componentThemesCss';
import { componentThemeCssMap } from '@utils/theme/createComponentThemeCss';
import { getThemeComponent, getThemeComponents, type UIThemeComponentName, type UIThemeComponents, type UIThemeName, resolveThemeName } from '@utils/theme/uiThemes';

/**
 * Resolves a raw theme name string into a valid `UIThemeName`.
 *
 * @param themeName - Raw theme name from props or layout input.
 * @returns The resolved `UIThemeName` when valid, otherwise `undefined`.
 *
 * @example
 * const name = getResolvedThemeName('warm');
 * // 'warm'
 *
 * @example
 * const missing = getResolvedThemeName('unknown');
 * // undefined
 */
export function getResolvedThemeName(themeName: string | undefined): UIThemeName | undefined {
  return resolveThemeName(themeName);
}

/**
 * Generates a global CSS string covering all component theme tokens for the given theme.
 * Iterates every component registered in the theme and composes their CSS variable declarations.
 * Returns `undefined` when the theme name is missing or invalid.
 *
 * @param themeName - Raw theme name, typically passed from a layout prop.
 * @returns A CSS string containing all component token overrides, or `undefined`.
 *
 * @example
 * const css = getComponentsThemeCss('warm');
 * // 'html:root { --input-field-wrapper-background: #fff7ed; --input-control-input-placeholder-color: #9a3412; ... }'
 *
 * @example
 * const none = getComponentsThemeCss(undefined);
 * // undefined
 */
export function getComponentsThemeCss(themeName: string | undefined): string | undefined {
  const resolvedThemeName = getResolvedThemeName(themeName);

  if (!resolvedThemeName) {
    return undefined;
  }

  const componentThemeResolvers = getThemeComponents(resolvedThemeName).map(({ name }) =>
    createTypedComponentResolver(name),
  );

  return createComponentsThemeCss(resolvedThemeName, componentThemeResolvers);
}

/**
 * Creates a type-safe component theme resolver for a single component.
 *
 * Captures `K` as a precise subtype of `UIThemeComponentName` so TypeScript can prove
 * that `getThemeComponent` and `componentThemeCssMap[name]` both operate on the same
 * `UIThemeComponents[K]` config type — no cast required.
 *
 * @param name - The component key as registered in `UIThemeComponentsConfig`.
 * @returns A resolver function that accepts a theme name and returns scoped CSS or `undefined`.
 *
 * @example
 * const resolver = createTypedComponentResolver('inputText');
 * const css = resolver('warm');
 * // 'html:root { --input-field-wrapper-background: #fff7ed; ... }'
 */
function createTypedComponentResolver<K extends UIThemeComponentName>(name: K) {
  return createComponentThemeResolver<UIThemeComponents[K], UIThemeName>({
    getThemeByName: (themeName: UIThemeName) => getThemeComponent(themeName, name),
    createThemeCss: componentThemeCssMap[name],
    selector: 'html:root',
  });
}
