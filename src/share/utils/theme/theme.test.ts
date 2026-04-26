import { getComponentsThemeCss, getResolvedThemeName } from '@utils/theme/theme';
import { getUIThemeNames } from '@utils/theme/uiThemes';

describe('getResolvedThemeName', () => {
  it('returns each discovered theme name when valid', () => {
    for (const themeName of getUIThemeNames()) {
      expect(getResolvedThemeName(themeName)).toBe(themeName);
    }
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

  it('returns either a CSS string or undefined for each discovered theme', () => {
    for (const themeName of getUIThemeNames()) {
      const result = getComponentsThemeCss(themeName);
      expect(result === undefined || typeof result === 'string').toBe(true);
    }
  });

  it('returned CSS (if present) contains valid CSS syntax for each discovered theme', () => {
    for (const themeName of getUIThemeNames()) {
      const css = getComponentsThemeCss(themeName);
      if (css) {
        // Should contain CSS selector and braces
        expect(css).toMatch(/\{[^}]*\}/u);
      }
    }
  });

  it('returned CSS does not contain null or undefined string literals', () => {
    for (const themeName of getUIThemeNames()) {
      const css = getComponentsThemeCss(themeName);
      if (css) {
        expect(css).not.toContain('null');
        expect(css).not.toContain('undefined');
      }
    }
  });

  it('multiple calls with same discovered theme return consistent structure', () => {
    for (const themeName of getUIThemeNames()) {
      const css1 = getComponentsThemeCss(themeName);
      const css2 = getComponentsThemeCss(themeName);
      expect(typeof css1).toBe(typeof css2);
    }
  });
});

describe('getComponentsThemeCss (component wiring integration)', () => {
  it('warm theme includes expected --input-field-* overrides', () => {
    const css = getComponentsThemeCss('warm');
    expect(css).toBeDefined();
    expect(css).toContain('--input-field-wrapper-background: #fff7ed');
    expect(css).toContain('--input-field-wrapper-border-color: #fdba74');
    expect(css).toContain('--input-field-label-active-color: #9a3412');
  });

  it('warm theme includes expected --input-control-* overrides', () => {
    const css = getComponentsThemeCss('warm');
    expect(css).toBeDefined();
    expect(css).toContain('--input-control-input-placeholder-color: #9a3412');
  });

  it('warm theme includes expected --chips-* overrides', () => {
    const css = getComponentsThemeCss('warm');
    expect(css).toBeDefined();
    expect(css).toContain('--chips-background-color: #fff7ed');
    expect(css).toContain('--chips-border-color: #fdba74');
    expect(css).toContain('--chips-color: #9a3412');
    expect(css).toContain('--chips-active-background-color: #fb923c');
    expect(css).toContain('--chips-active-border-color: #ea580c');
    expect(css).toContain('--chips-active-color: #ffffff');
  });

  it('warm theme CSS contains both inputText and chips blocks', () => {
    const css = getComponentsThemeCss('warm');
    expect(css).toBeDefined();
    // each component block is wrapped in html:root { ... }
    const blockCount = (css?.match(/html:root\s*\{/gu) ?? []).length;
    expect(blockCount).toBeGreaterThanOrEqual(2);
  });
});
