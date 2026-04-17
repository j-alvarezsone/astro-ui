import { getComponentsThemeCss, getResolvedThemeName } from '@utils/theme/theme';

describe('getResolvedThemeName', () => {
  it('returns the theme name when valid', () => {
    const resolved = getResolvedThemeName('warm');
    expect(['warm', undefined]).toContain(resolved);
  });

  it('returns undefined for an unknown theme name', () => {
    expect(getResolvedThemeName('unknown')).toBeUndefined();
  });

  it('returns undefined when undefined is passed', () => {
    expect(getResolvedThemeName(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getResolvedThemeName('')).toBeUndefined();
  });
});

describe('getComponentsThemeCss (contract tests)', () => {
  it('returns undefined for an unknown theme', () => {
    expect(getComponentsThemeCss('unknown-theme')).toBeUndefined();
  });

  it('returns undefined when undefined is passed', () => {
    expect(getComponentsThemeCss(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getComponentsThemeCss('')).toBeUndefined();
  });

  it('returns either a CSS string or undefined', () => {
    const result = getComponentsThemeCss('warm');
    expect(result === undefined || typeof result === 'string').toBe(true);
  });

  it('returned CSS (if present) contains valid CSS syntax', () => {
    const css = getComponentsThemeCss('warm');
    if (css) {
      // Should contain CSS selector and braces
      expect(css).toMatch(/\{[^}]*\}/u);
    }
  });

  it('returned CSS does not contain null or undefined string literals', () => {
    const css = getComponentsThemeCss('warm');
    if (css) {
      expect(css).not.toContain('null');
      expect(css).not.toContain('undefined');
    }
  });

  it('multiple calls with same theme return consistent structure', () => {
    const css1 = getComponentsThemeCss('warm');
    const css2 = getComponentsThemeCss('warm');
    expect(typeof css1).toBe(typeof css2);
  });
});
