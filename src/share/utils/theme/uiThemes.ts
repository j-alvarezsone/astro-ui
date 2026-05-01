import type { Keyof } from '@/types/index';
import type { UIThemeConfig } from '@/types/theme/uiThemes';
import { hasOwnKey } from '@utils/object/hasOwnKey';

const UI_THEMES = {
  warm: {
    components: {
      // inputText: {
      //   wrapper: {
      //     backgroundColor: '#fff7ed',
      //     borderColor: '#fdba74',
      //     hoverBorderColor: '#fb923c',
      //     focusBorderColor: '#ea580c',
      //     focusRingColor: '#fb923c',
      //     focusRingWidth: 'var(--spacing-0-5)',
      //     errorBorderColor: '#fca5a5',
      //     invalidRingColor: '#fee2e2',
      //     validBorderColor: '#88e788',
      //     validRingColor: '#ecfdf3',
      //   },
      //   label: {
      //     activeColor: '#9a3412',
      //   },
      //   input: {
      //     placeholderColor: '#9a3412',
      //   },
      // },
      // button: {
      //   root: {
      //     primaryBackgroundColor: '#ea580c',
      //     primaryHoverBackgroundColor: '#c2410c',
      //     primaryFocusRingColor: '#fb923c',
      //   },
      //   label: {
      //     mdFontSize: '0.9375rem',
      //   },
      //   icon: {
      //     color: '#fff',
      //   },
      // },
      // chips: {
      //   root: {
      //     backgroundColor: '#fff7ed',
      //     borderColor: '#fdba74',
      //     color: '#9a3412',
      //     activeBackgroundColor: '#fb923c',
      //     activeBorderColor: '#ea580c',
      //     activeColor: '#ffffff',
      //   },
      // },
    },
  },
} as const satisfies Record<string, UIThemeConfig>;

export type UIThemeComponents = UIThemeConfig['components'];
type UILiteralThemeName = Keyof<typeof UI_THEMES>;
export type UIThemeName = [UILiteralThemeName] extends [never] ? string : UILiteralThemeName;
export type UIThemeComponentName = Keyof<UIThemeComponents>;
export type UIThemeComponentEntry<TName extends UIThemeComponentName = UIThemeComponentName> = {
  name: TName;
  config: UIThemeComponents[TName];
};

/**
 * Returns all available UI theme names.
 *
 * @returns List of valid `UIThemeName` values currently registered in `UI_THEMES`.
 *
 * @example
 * const names = getUIThemeNames();
 * // ['warm']
 */
export function getUIThemeNames(): UIThemeName[] {
  return Object.keys(UI_THEMES).filter((themeName): themeName is UIThemeName => isUIThemeName(themeName));
}

/**
 * Checks whether a string matches one of the available UI theme names.
 *
 * @param themeName - Raw theme name value to validate.
 * @returns True when the input is a valid `UIThemeName`.
 *
 * @example
 * const isValid = isUIThemeName('warm');
 * // true
 */
export function isUIThemeName(themeName: string): themeName is UIThemeName {
  return hasOwnKey(UI_THEMES, themeName);
}

/**
 * Checks whether a component key exists within a theme components object.
 *
 * @param componentName - Component key to validate.
 * @param components - Theme components map for the current theme.
 * @returns True when the component key exists in the provided components map.
 *
 * @example
 * const exists = isUIThemeComponentName('inputText', UI_THEMES.warm.components);
 * // true
 */
function isUIThemeComponentName(
  componentName: string,
  components: UIThemeComponents,
): componentName is UIThemeComponentName {
  return hasOwnKey(components, componentName);
}

/**
 * Resolves a raw theme value into a valid UI theme name.
 * Returns undefined when the provided value is missing or invalid.
 *
 * @param themeName - Raw theme name from props or runtime input.
 * @returns The resolved `UIThemeName` when valid, otherwise undefined.
 *
 * @example
 * const resolved = resolveThemeName('warm');
 * // 'warm'
 *
 * @example
 * const missing = resolveThemeName('unknown-theme');
 * // undefined
 */
export function resolveThemeName(themeName: string | undefined): UIThemeName | undefined {
  if (themeName && isUIThemeName(themeName)) {
    return themeName;
  }

  return undefined;
}

/**
 * Returns all component theme entries for a given theme.
 * Entries include the component name and its resolved config.
 *
 * @param themeName - Resolved theme name to read component configs from.
 * @returns List of component entries with `{ name, config }`.
 *
 * @example
 * const entries = getThemeComponents('warm');
 * // [{ name: 'inputText', config: { ... } }]
 */
export function getThemeComponents(themeName: UIThemeName): UIThemeComponentEntry[] {
  const themesByName: Readonly<Record<string, UIThemeConfig>> = UI_THEMES;
  const theme = themesByName[themeName];

  if (!theme) {
    return [];
  }

  const { components } = theme;
  const componentEntries: UIThemeComponentEntry[] = [];

  for (const componentName of Object.keys(components)) {
    if (!isUIThemeComponentName(componentName, components)) {
      continue;
    }

    const config = components[componentName];

    if (config === undefined) {
      continue;
    }

    componentEntries.push({ name: componentName, config });
  }

  return componentEntries;
}

/**
 * Returns the theme configuration for a single component by name.
 *
 * @param themeName - Resolved theme name to read from.
 * @param componentName - Component key within the theme's components map.
 * @returns The component-specific theme configuration, or undefined when the selected theme does not override that component.
 *
 * @example
 * const inputTextTheme = getThemeComponent('warm', 'inputText');
 * // { wrapper: { ... }, label: { ... }, input: { ... } }
 */
export function getThemeComponent<TName extends UIThemeComponentName>(
  themeName: UIThemeName,
  componentName: TName,
): UIThemeComponents[TName] | undefined {
  const themesByName: Readonly<Record<string, UIThemeConfig>> = UI_THEMES;
  return themesByName[themeName]?.components[componentName];
}
