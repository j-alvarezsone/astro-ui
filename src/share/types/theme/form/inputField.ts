import type { PassThroughAttributes } from '@/types/theme/form/shared';

export const INPUT_FIELD_PT_SLOT_NAMES = [
  'root',
  'wrapper',
  'label',
  'icon',
  'helpText',
  'errorText',
] as const;

export type InputFieldPassThroughSlotName = (typeof INPUT_FIELD_PT_SLOT_NAMES)[number];

export type InputFieldPassThrough = Partial<Record<InputFieldPassThroughSlotName, PassThroughAttributes>>;
/**
 * CSS selector overrides for InputField pt slots whose actual class names
 * deviate from the standard BEM pattern.
 * Reuse this in any page that calls `createComponentSlots` for InputField or InputText.
 */
export const INPUT_FIELD_SELECTOR_OVERRIDES = {
  label: '.input-label',
  helpText: '.input-field__help',
  errorText: '.input-field__error',
} as const;

export interface InputFieldStyleConfig {
  root?: {
    gap?: string;
  };
  wrapper?: {
    gap?: string;
    backgroundColor?: string;
    borderColor?: string;
    hoverBorderColor?: string;
    focusBorderColor?: string;
    focusRingColor?: string;
    focusRingWidth?: string;
    errorBorderColor?: string;
    invalidRingColor?: string;
    validBorderColor?: string;
    validRingColor?: string;
    disabledBackgroundColor?: string;
    borderRadius?: string;
    paddingInline?: string;
  };
  label?: {
    color?: string;
    defaultColor?: string;
    activeColor?: string;
    backgroundColor?: string;
    requiredColor?: string;
    optionalColor?: string;
  };
  icon?: {
    color?: string;
    disabledOpacity?: string | number;
  };
  helpText?: {
    color?: string;
  };
  errorText?: {
    color?: string;
  };
}
