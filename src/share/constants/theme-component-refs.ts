export interface ComponentRef {
  label: string;
  description: string;
  category: string;
  href: string;
}

export const THEME_COMPONENT_REFS: ComponentRef[] = [
  {
    label: 'InputText',
    description: 'PT + theme config reference',
    category: 'Form',
    href: '/theme-system/input-text',
  },
  {
    label: 'InputField',
    description: 'Shared shell + token reference',
    category: 'Form',
    href: '/theme-system/input-field',
  },
  {
    label: 'Chips',
    description: 'Single-slot pt + token reference',
    category: 'Misc',
    href: '/theme-system/chips',
  },
  {
    label: 'Button',
    description: 'Multi-variant pt + token reference',
    category: 'UI',
    href: '/theme-system/button',
  },
];
