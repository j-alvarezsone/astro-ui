import type { InputTextStyleConfig } from '@/types/theme/form/inputText';

export interface UIThemeComponentsConfig {
  inputText?: InputTextStyleConfig;
}

export interface UIThemeConfig {
  components: UIThemeComponentsConfig;
}
