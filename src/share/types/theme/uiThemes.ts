import type { ChipsStyleConfig } from '@/types/theme/misc/chips';
import type { InputTextStyleConfig } from '@/types/theme/form/inputText';

export interface UIThemeComponentsConfig {
  inputText?: InputTextStyleConfig;
  chips?: ChipsStyleConfig;
}

export interface UIThemeConfig {
  components: UIThemeComponentsConfig;
}
