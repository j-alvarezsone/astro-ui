#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const iconsJsonPath = path.resolve('node_modules/@iconify-json/mdi/icons.json');
const outDir = path.resolve('src/share/types');
const outFile = path.join(outDir, 'mdi-icons.d.ts');
const moduleFile = path.join(outDir, 'astro-icon.d.ts');

function isIconsData(value: unknown): value is { icons: Record<string, unknown> } {
  if (typeof value !== 'object' || value === null) return false;
  if (!('icons' in value)) return false;
  const icons = (value as Record<string, unknown>)['icons'];
  if (typeof icons !== 'object' || icons === null) return false;
  if (Array.isArray(icons)) return false;
  return true;
}

async function main(){
  try{
    const raw = await fs.readFile(iconsJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!isIconsData(parsed)) {
      console.error('Icons JSON has unexpected shape');
      process.exit(2);
    }
    const iconsObj = parsed.icons ?? {};
    const parsedRecord = parsed as Record<string, unknown>;
    const maybePrefix = parsedRecord['prefix'];
    const prefix = typeof maybePrefix === 'string' ? maybePrefix : '';
    const icons = Object.keys(iconsObj);
    if(!icons.length) {
      console.error('No icons found in', iconsJsonPath);
      process.exit(1);
    }
    await fs.mkdir(outDir, { recursive: true });

    // Build a prefixed union like 'mdi:account' so suggestions include the set prefix
    const prefixed = icons.map(s => JSON.stringify(prefix ? `${prefix}:${s}` : s)).join(' | ');
    const typeContent = `export type MDIIconName = ${icons.map(s => JSON.stringify(s)).join(' | ')};\nexport type PrefixedMDIIconName = ${prefixed};\n`;
    await fs.writeFile(outFile, typeContent, 'utf8');

    // virtual module declaration exporting the Icon union type
    const virtualDecl = `declare module 'virtual:astro-icon' {\n  import type { IntegrationOptions, IconCollection } from 'astro-icon/typings/integration';\n  export type Icon = ${prefixed};\n  const icons: Record<string, IconCollection>;\n  export default icons;\n  export const config: IntegrationOptions;\n}\n`;
    await fs.writeFile(path.join(outDir, 'virtual-astro-icon.d.ts'), virtualDecl, 'utf8');

    // Component declaration for astro-icon components
    const moduleDecl = `declare module 'astro-icon/components' {\n  import type { HTMLAttributes } from 'astro/types';\n  import type { Icon as IconName } from 'virtual:astro-icon';\n  export interface IconProps extends HTMLAttributes<'svg'> {\n    name: IconName;\n    'is:inline'?: boolean;\n    title?: string;\n    desc?: string;\n    size?: number | string;\n    width?: number | string;\n    height?: number | string;\n    [key: string]: unknown;\n  }\n  export const Icon: (props: IconProps) => unknown;\n  export default Icon;\n}\n`;
    await fs.writeFile(moduleFile, moduleDecl, 'utf8');

    console.warn('Generated', outFile, 'and', moduleFile);
  } catch (err) {
    if(err instanceof SyntaxError) {
      console.error('Failed to parse icons JSON:', err.message);
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(2);
  }
}

void main();
