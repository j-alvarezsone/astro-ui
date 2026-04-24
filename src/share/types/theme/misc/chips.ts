import type { PassThroughAttributes } from '@/types/theme/form/shared';

export interface ChipsPassThrough {
  root?: PassThroughAttributes;
}

export interface ChipsStyleConfig {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  activeBackgroundColor?: string;
  activeBorderColor?: string;
  activeColor?: string;
}
