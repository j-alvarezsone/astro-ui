declare module 'astro-icon/components' {
  import type { HTMLAttributes } from 'astro/types';
  import type { Icon as IconName } from 'virtual:astro-icon';
  export interface IconProps extends HTMLAttributes<'svg'> {
    name: IconName;
    'is:inline'?: boolean;
    title?: string;
    desc?: string;
    size?: number | string;
    width?: number | string;
    height?: number | string;
    [key: string]: unknown;
  }
  export const Icon: (props: IconProps) => unknown;
  export default Icon;
}
