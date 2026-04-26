import type { PassThroughAttributes } from '@/types/theme/form/shared';

export const CHIPS_PT_SLOT_NAMES = ['root', 'image', 'icon', 'label', 'removeIcon'] as const;

export type ChipsPassThroughSlotName = (typeof CHIPS_PT_SLOT_NAMES)[number];

export type ChipsPassThrough = Partial<Record<ChipsPassThroughSlotName, PassThroughAttributes>>;

export interface ChipsRootStyleConfig {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  borderRadius?: string;
  activeBackgroundColor?: string;
  activeBorderColor?: string;
  activeColor?: string;
  focusRingColor?: string;
  focusRingOverlayColor?: string;
}

export interface ChipsImageStyleConfig {
  borderRadius?: string;
}

export type ChipsIconStyleConfig = {
  color?: string;
};

export type ChipsLabelStyleConfig = {
  color?: string;
  fontWeight?: string;
  fontSize?: string;
};

export type ChipsRemoveIconStyleConfig = {
  color?: string;
};

export interface ChipsStyleConfig {
  root?: ChipsRootStyleConfig;
  image?: ChipsImageStyleConfig;
  icon?: ChipsIconStyleConfig;
  label?: ChipsLabelStyleConfig;
  removeIcon?: ChipsRemoveIconStyleConfig;
}
