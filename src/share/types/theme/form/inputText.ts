import type { InputFieldStyleConfig } from '@/types/theme/form/inputField';
import type { PassThroughAttributes } from '@/types/theme/form/shared';

export interface InputTextPassThrough {
  root?: PassThroughAttributes;
  wrapper?: PassThroughAttributes;
  input?: PassThroughAttributes;
  label?: PassThroughAttributes;
  icon?: PassThroughAttributes;
  helpText?: PassThroughAttributes;
  errorText?: PassThroughAttributes;
}

export interface InputTextStyleConfig extends InputFieldStyleConfig {
  input?: {
    color?: string;
    paddingBlock?: string;
    placeholderColor?: string;
    placeholderErrorColor?: string;
    disabledColor?: string;
  };
}