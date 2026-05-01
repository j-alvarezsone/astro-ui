import type { PassThroughAttributes } from '@/types/theme/form/shared';

export const BUTTON_PT_SLOT_NAMES = ['root', 'icon', 'label', 'loader'] as const;

export type ButtonPassThroughSlotName = (typeof BUTTON_PT_SLOT_NAMES)[number];

export type ButtonPassThrough = Partial<Record<ButtonPassThroughSlotName, PassThroughAttributes>>;

export interface ButtonRootStyleConfig {
  gap?: string;
  borderWidth?: string;
  borderRadius?: string;
  roundedBorderRadius?: string;
  smPaddingBlock?: string;
  smPaddingInline?: string;
  mdPaddingBlock?: string;
  mdPaddingInline?: string;
  lgPaddingBlock?: string;
  lgPaddingInline?: string;
  primaryBackgroundColor?: string;
  primaryColor?: string;
  primaryBorderColor?: string;
  primaryHoverBackgroundColor?: string;
  secondaryBackgroundColor?: string;
  secondaryColor?: string;
  secondaryBorderColor?: string;
  secondaryHoverBackgroundColor?: string;
  contrastBackgroundColor?: string;
  contrastColor?: string;
  contrastBorderColor?: string;
  contrastHoverBackgroundColor?: string;
  successBackgroundColor?: string;
  successColor?: string;
  successBorderColor?: string;
  successHoverBackgroundColor?: string;
  warningBackgroundColor?: string;
  warningColor?: string;
  warningBorderColor?: string;
  warningHoverBackgroundColor?: string;
  dangerBackgroundColor?: string;
  dangerColor?: string;
  dangerBorderColor?: string;
  dangerHoverBackgroundColor?: string;
  disabledBackgroundColor?: string;
  disabledColor?: string;
  disabledBorderColor?: string;
  linkDisabledColor?: string;
  linkDisabledOpacity?: string;
  focusRingWidth?: string;
  primaryFocusRingColor?: string;
  secondaryFocusRingColor?: string;
  contrastFocusRingColor?: string;
  successFocusRingColor?: string;
  warningFocusRingColor?: string;
  dangerFocusRingColor?: string;
}

export type ButtonIconStyleConfig = {
  color?: string;
};

export type ButtonLabelStyleConfig = {
  smFontSize?: string;
  mdFontSize?: string;
  lgFontSize?: string;
  loadingOpacity?: string;
};

export type ButtonLoaderStyleConfig = {
  color?: string;
};

export interface ButtonStyleConfig {
  root?: ButtonRootStyleConfig;
  icon?: ButtonIconStyleConfig;
  label?: ButtonLabelStyleConfig;
  loader?: ButtonLoaderStyleConfig;
}
