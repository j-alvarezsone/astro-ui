import { createComponentThemeResolver, createComponentsThemeCss } from '@utils/theme/componentThemesCss';
import { createComponentThemeCss } from '@utils/theme/createComponentThemeCss';
import { getThemeComponent, getThemeComponents, type UIThemeName, resolveThemeName } from '@utils/theme/uiThemes';

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
 * // 'html:root { --input-field-wrapper-background: #fff7ed; --input-text-input-placeholder-color: #9a3412; ... }'
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
    createComponentThemeResolver({
      getThemeByName: (currentThemeName: UIThemeName) => getThemeComponent(currentThemeName, name),
      createThemeCss: createComponentThemeCss,
      selector: 'html:root',
    }),
  );

  return createComponentsThemeCss(resolvedThemeName, componentThemeResolvers);
}
