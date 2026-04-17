type ThemeCssResolver<TThemeName extends string = string> = (resolvedThemeName: TThemeName) => string | undefined;

interface CreateComponentThemeResolverParams<TThemeConfig, TThemeName extends string = string> {
  getThemeByName: (themeName: TThemeName) => TThemeConfig | undefined;
  createThemeCss: (config: TThemeConfig | undefined, selector?: string) => string | undefined;
  selector?: string;
}

/**
 * Creates a resolver function that generates CSS variable declarations for a single component theme.
 * The returned resolver accepts a theme name and produces the CSS string for that component.
 *
 * @param params - Configuration for the component theme resolver.
 * @param params.getThemeByName - Retrieves the component-specific theme config for a given theme name.
 * @param params.createThemeCss - Converts a component theme config into a CSS string.
 * @param params.selector - CSS selector to scope the generated variables. Defaults to `':root'`.
 * @returns A resolver function `(themeName: TThemeName) => string | undefined`.
 *
 * @example
 * const resolver = createComponentThemeResolver({
 *   getThemeByName: (name) => getThemeComponent(name, 'inputText'),
 *   createThemeCss,
 *   selector: 'html:root',
 * });
 * const css = resolver('warm');
 * // 'html:root { --input-field-wrapper-background: #fff7ed; --input-text-input-placeholder-color: #9a3412; ... }'
 */
export function createComponentThemeResolver<TThemeConfig, TThemeName extends string = string>({
  getThemeByName,
  createThemeCss,
  selector = ':root',
}: CreateComponentThemeResolverParams<TThemeConfig, TThemeName>): ThemeCssResolver<TThemeName> {
  return (resolvedThemeName: TThemeName) => createThemeCss(getThemeByName(resolvedThemeName), selector);
}

/**
 * Runs all component theme resolvers for a given theme and combines their output into a single CSS string.
 * Resolvers that return `undefined` are silently skipped.
 * Returns `undefined` when no resolver produces any output.
 *
 * @param resolvedThemeName - The validated theme name to pass to each resolver.
 * @param resolvers - Array of resolver functions, one per component.
 * @returns A combined CSS string of all component token overrides, or `undefined` when empty.
 *
 * @example
 * const css = createComponentsThemeCss('warm', [inputTextResolver, buttonResolver]);
 * // 'html:root { --input-field-wrapper-background: #fff7ed; --input-text-input-placeholder-color: #9a3412; ... }\nhtml:root { --button-color: ...; }'
 */
export function createComponentsThemeCss<TThemeName extends string>(
  resolvedThemeName: TThemeName,
  resolvers: ThemeCssResolver<TThemeName>[],
): string | undefined {
  const css = resolvers
    .map((resolveCss) => resolveCss(resolvedThemeName))
    .filter((value): value is string => Boolean(value))
    .join('\n');

  if (!css) {
    return undefined;
  }

  return css;
}