export type ClassValue = string | string[];
export type StyleValue = string | Record<string, string | number> | null;

export interface PassThroughAttributes {
  class?: ClassValue;
  style?: StyleValue;
  [attribute: string]: unknown;
}