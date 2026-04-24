import type { PassThroughAttributes } from '@/types/theme/form/shared';

export const CHIPS_PT_SLOT_NAMES = ['root', 'image', 'icon', 'label', 'removeIcon'] as const;

export type ChipsPassThroughSlotName = (typeof CHIPS_PT_SLOT_NAMES)[number];

export type ChipsPassThrough = Partial<Record<ChipsPassThroughSlotName, PassThroughAttributes>>;

export interface ChipsStyleConfig {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  activeBackgroundColor?: string;
  activeBorderColor?: string;
  activeColor?: string;
}
