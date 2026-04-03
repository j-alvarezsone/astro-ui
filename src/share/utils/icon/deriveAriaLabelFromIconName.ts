/**
 * Creates a readable aria-label for icon-only buttons from an icon name.
 *
 * Examples:
 * - `mdi:account-alert` -> `Account Alert button`
 * - `account_alert` -> `Account Alert button`
 *
 * Returns `undefined` when the input is empty or cannot be normalized.
 */
export function deriveAriaLabelFromIconName(iconName?: string): string | undefined {
  if (!iconName) {
    return undefined;
  }

  const rawName = iconName.includes(':') ? iconName.split(':').at(-1) : iconName;
  const normalizedName = rawName?.replace(/[-_]+/g, ' ').trim();

  if (!normalizedName) {
    return undefined;
  }

  const prettyName = normalizedName.replace(/\b\w/g, (char) => char.toUpperCase());
  return `${prettyName} button`;
}
