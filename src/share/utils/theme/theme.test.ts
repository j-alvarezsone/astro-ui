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

describe('getComponentsThemeCss (orchestration with mocks)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns undefined and skips composition when theme cannot be resolved', async () => {
    const resolveThemeNameMock = vi.fn(() => undefined);
    const getThemeComponentsMock = vi.fn(() => []);
    const getThemeComponentMock = vi.fn(() => undefined);
    const createComponentThemeResolverMock = vi.fn();
    const createComponentsThemeCssMock = vi.fn(() => 'unused-css');

    vi.doMock('@utils/theme/uiThemes', () => ({
      resolveThemeName: resolveThemeNameMock,
      getThemeComponents: getThemeComponentsMock,
      getThemeComponent: getThemeComponentMock,
    }));

    vi.doMock('@utils/theme/componentThemesCss', () => ({
      createComponentThemeResolver: createComponentThemeResolverMock,
      createComponentsThemeCss: createComponentsThemeCssMock,
    }));

    vi.doMock('@utils/theme/createComponentThemeCss', () => ({
      componentThemeCssMap: {
        inputText: vi.fn(),
        chips: vi.fn(),
      },
    }));

    const { getComponentsThemeCss: getComponentsThemeCssWithMocks } = await import('@utils/theme/theme');

    expect(getComponentsThemeCssWithMocks('unknown-theme')).toBeUndefined();
    expect(resolveThemeNameMock).toHaveBeenCalledWith('unknown-theme');
    expect(getThemeComponentsMock).not.toHaveBeenCalled();
    expect(createComponentThemeResolverMock).not.toHaveBeenCalled();
    expect(createComponentsThemeCssMock).not.toHaveBeenCalled();
  });

  it('creates one resolver per discovered component and composes css for resolved theme', async () => {
    const inputTextConfig = { input: { placeholderColor: '#111111' } };
    const chipsConfig = { root: { color: '#222222' } };
    const resolvedConfigs: unknown[] = [];

    const resolveThemeNameMock = vi.fn((themeName: string | undefined) => (themeName ? 'warm' : undefined));
    const getThemeComponentsMock = vi.fn(() => [
      { name: 'inputText', config: inputTextConfig },
      { name: 'chips', config: chipsConfig },
    ]);
    const getThemeComponentMock = vi.fn((_: string, componentName: string) => {
      if (componentName === 'inputText') {
        return inputTextConfig;
      }

      if (componentName === 'chips') {
        return chipsConfig;
      }

      return undefined;
    });

    const inputTextCssFactory = vi.fn();
    const chipsCssFactory = vi.fn();
    const createComponentThemeResolverMock = vi.fn((options: { selector: string; getThemeByName: (themeName: string) => unknown }) => {
      resolvedConfigs.push(options.getThemeByName('warm'));
      return () => `${options.selector}-resolver`;
    });
    const createComponentsThemeCssMock = vi.fn(() => 'mock-css-output');

    vi.doMock('@utils/theme/uiThemes', () => ({
      resolveThemeName: resolveThemeNameMock,
      getThemeComponents: getThemeComponentsMock,
      getThemeComponent: getThemeComponentMock,
    }));

    vi.doMock('@utils/theme/componentThemesCss', () => ({
      createComponentThemeResolver: createComponentThemeResolverMock,
      createComponentsThemeCss: createComponentsThemeCssMock,
    }));

    vi.doMock('@utils/theme/createComponentThemeCss', () => ({
      componentThemeCssMap: {
        inputText: inputTextCssFactory,
        chips: chipsCssFactory,
      },
    }));

    const { getComponentsThemeCss: getComponentsThemeCssWithMocks } = await import('@utils/theme/theme');

    expect(getComponentsThemeCssWithMocks('warm')).toBe('mock-css-output');
    expect(resolveThemeNameMock).toHaveBeenCalledWith('warm');
    expect(getThemeComponentsMock).toHaveBeenCalledWith('warm');
    expect(createComponentThemeResolverMock).toHaveBeenCalledTimes(2);
    expect(createComponentThemeResolverMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ selector: 'html:root', createThemeCss: inputTextCssFactory }),
    );
    expect(createComponentThemeResolverMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ selector: 'html:root', createThemeCss: chipsCssFactory }),
    );
    expect(getThemeComponentMock).toHaveBeenCalledWith('warm', 'inputText');
    expect(getThemeComponentMock).toHaveBeenCalledWith('warm', 'chips');
    expect(resolvedConfigs).toEqual([inputTextConfig, chipsConfig]);
    expect(createComponentsThemeCssMock).toHaveBeenCalledWith('warm', expect.any(Array));
  });
});
