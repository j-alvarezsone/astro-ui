import type { ButtonStyleConfig } from '@/types/theme/button';

/**
 * Converts a `ButtonStyleConfig` into CSS custom-property declarations for the button component.
 *
 * @param config - Button style config with per-slot sub-configs for root, icon, label, and loader.
 * @returns A semicolon-separated CSS declaration string, or `undefined` when no values are present.
 *
 * @example
 * const vars = createButtonStyleVars({
 *   root: {
 *     primaryBackgroundColor: '#2563eb',
 *     focusRingColor: '#60a5fa',
 *   },
 *   label: {
 *     mdFontSize: '0.875rem',
 *   },
 * });
 * // '--button-primary-background-color: #2563eb; --button-focus-ring-color: #60a5fa; --button-label-md-font-size: 0.875rem'
 */
export function createButtonStyleVars(config: ButtonStyleConfig | undefined): string | undefined {
  if (!config) {
    return undefined;
  }

  const entries: [string, string | undefined][] = [
    ['--button-gap', config.root?.gap],
    ['--button-border-width', config.root?.borderWidth],
    ['--button-border-radius', config.root?.borderRadius],
    ['--button-rounded-border-radius', config.root?.roundedBorderRadius],
    ['--button-sm-padding-block', config.root?.smPaddingBlock],
    ['--button-sm-padding-inline', config.root?.smPaddingInline],
    ['--button-md-padding-block', config.root?.mdPaddingBlock],
    ['--button-md-padding-inline', config.root?.mdPaddingInline],
    ['--button-lg-padding-block', config.root?.lgPaddingBlock],
    ['--button-lg-padding-inline', config.root?.lgPaddingInline],
    ['--button-primary-background-color', config.root?.primaryBackgroundColor],
    ['--button-primary-color', config.root?.primaryColor],
    ['--button-primary-border-color', config.root?.primaryBorderColor],
    ['--button-primary-hover-background-color', config.root?.primaryHoverBackgroundColor],
    ['--button-secondary-background-color', config.root?.secondaryBackgroundColor],
    ['--button-secondary-color', config.root?.secondaryColor],
    ['--button-secondary-border-color', config.root?.secondaryBorderColor],
    ['--button-secondary-hover-background-color', config.root?.secondaryHoverBackgroundColor],
    ['--button-contrast-background-color', config.root?.contrastBackgroundColor],
    ['--button-contrast-color', config.root?.contrastColor],
    ['--button-contrast-border-color', config.root?.contrastBorderColor],
    ['--button-contrast-hover-background-color', config.root?.contrastHoverBackgroundColor],
    ['--button-success-background-color', config.root?.successBackgroundColor],
    ['--button-success-color', config.root?.successColor],
    ['--button-success-border-color', config.root?.successBorderColor],
    ['--button-success-hover-background-color', config.root?.successHoverBackgroundColor],
    ['--button-warning-background-color', config.root?.warningBackgroundColor],
    ['--button-warning-color', config.root?.warningColor],
    ['--button-warning-border-color', config.root?.warningBorderColor],
    ['--button-warning-hover-background-color', config.root?.warningHoverBackgroundColor],
    ['--button-danger-background-color', config.root?.dangerBackgroundColor],
    ['--button-danger-color', config.root?.dangerColor],
    ['--button-danger-border-color', config.root?.dangerBorderColor],
    ['--button-danger-hover-background-color', config.root?.dangerHoverBackgroundColor],
    ['--button-disabled-background-color', config.root?.disabledBackgroundColor],
    ['--button-disabled-color', config.root?.disabledColor],
    ['--button-disabled-border-color', config.root?.disabledBorderColor],
    ['--button-link-disabled-color', config.root?.linkDisabledColor],
    ['--button-link-disabled-opacity', config.root?.linkDisabledOpacity],
    ['--button-focus-ring-width', config.root?.focusRingWidth],
    ['--button-primary-focus-ring-color', config.root?.primaryFocusRingColor],
    ['--button-secondary-focus-ring-color', config.root?.secondaryFocusRingColor],
    ['--button-contrast-focus-ring-color', config.root?.contrastFocusRingColor],
    ['--button-success-focus-ring-color', config.root?.successFocusRingColor],
    ['--button-warning-focus-ring-color', config.root?.warningFocusRingColor],
    ['--button-danger-focus-ring-color', config.root?.dangerFocusRingColor],
    ['--button-icon-color', config.icon?.color],
    ['--button-label-sm-font-size', config.label?.smFontSize],
    ['--button-label-md-font-size', config.label?.mdFontSize],
    ['--button-label-lg-font-size', config.label?.lgFontSize],
    ['--button-label-loading-opacity', config.label?.loadingOpacity],
    ['--button-loader-color', config.loader?.color],
  ];

  const declarations = entries
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .map(([property, value]) => `${property}: ${value}`);

  if (declarations.length === 0) {
    return undefined;
  }

  return declarations.join('; ');
}
