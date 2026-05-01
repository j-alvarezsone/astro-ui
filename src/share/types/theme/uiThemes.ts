import type { ChipsStyleConfig } from '@/types/theme/misc/chips';
import type { InputTextStyleConfig } from '@/types/theme/form/inputText';
import type { ButtonStyleConfig } from '@/types/theme/button';

export interface UIThemeComponentsConfig {
  inputText?: InputTextStyleConfig;
  chips?: ChipsStyleConfig;
  button?: ButtonStyleConfig;
}

export interface UIThemeConfig {
  components: UIThemeComponentsConfig;
}
