import type { InputFieldStyleConfig } from '@/types/theme/form/inputField';
import type { PassThroughAttributes } from '@/types/theme/form/shared';

export const INPUT_TEXT_PT_SLOT_NAMES = [
  'root',
  'wrapper',
  'input',
  'label',
  'icon',
  'helpText',
  'errorText',
] as const;

export type InputTextPassThroughSlotName = (typeof INPUT_TEXT_PT_SLOT_NAMES)[number];

export type InputTextPassThrough = Partial<Record<InputTextPassThroughSlotName, PassThroughAttributes>>;

export interface InputTextStyleConfig extends InputFieldStyleConfig {
  input?: {
    color?: string;
    paddingBlock?: string;
    placeholderColor?: string;
    placeholderErrorColor?: string;
    disabledColor?: string;
  };
}
