import {
  getUIThemeNames,
  getThemeComponent,
  getThemeComponents,
  isUIThemeName,
  resolveThemeName,
} from '@utils/theme/uiThemes';

describe('isUIThemeName', () => {
  it('returns booleans for all discovered theme names, including empty registries', () => {
    const themeNames = getUIThemeNames();
    expect(Array.isArray(themeNames)).toBe(true);

    for (const themeName of themeNames) {
      expect(isUIThemeName(themeName)).toBe(true);
    }
  });

  it('returns false for unknown theme names', () => {
    expect(isUIThemeName('unknown')).toBe(false);
    expect(isUIThemeName('not-a-theme')).toBe(false);
  });

  it('returns false for prototype keys', () => {
    expect(isUIThemeName('toString')).toBe(false);
    expect(isUIThemeName('constructor')).toBe(false);
  });
});

describe('resolveThemeName', () => {
  it('returns resolved theme names for valid values', () => {
    for (const themeName of getUIThemeNames()) {
      expect(resolveThemeName(themeName)).toBe(themeName);
    }
  });

  it('returns undefined for unknown values', () => {
    expect(resolveThemeName('unknown')).toBeUndefined();
    expect(resolveThemeName('toString')).toBeUndefined();
  });

  it('returns undefined for empty and missing values', () => {
    expect(resolveThemeName('')).toBeUndefined();
    expect(resolveThemeName(undefined)).toBeUndefined();
  });
});

describe('theme component contracts', () => {
  it('returns component entries for each discovered theme name', () => {
    for (const themeName of getUIThemeNames()) {
      const entries = getThemeComponents(themeName);

      expect(Array.isArray(entries)).toBe(true);

      for (const entry of entries) {
        expect(typeof entry.name).toBe('string');
        expect(entry.config).toBeDefined();
      }
    }
  });

  it('returns matching config between getThemeComponents and getThemeComponent', () => {
    for (const themeName of getUIThemeNames()) {
      const entries = getThemeComponents(themeName);

      for (const entry of entries) {
        expect(getThemeComponent(themeName, entry.name)).toEqual(entry.config);
      }
    }
  });
});
