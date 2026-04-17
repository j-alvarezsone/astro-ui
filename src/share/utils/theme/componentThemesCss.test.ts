import { createComponentThemeResolver, createComponentsThemeCss } from '@utils/theme/componentThemesCss';

interface SimpleConfig {
  color?: string;
  bg?: string;
}

function createSimpleCss(config: SimpleConfig | undefined, selector = ':root'): string | undefined {
  if (!config?.color) return undefined;
  return `${selector} { --color: ${config.color}; }`;
}

function getSimpleTheme(name: string): SimpleConfig | undefined {
  const themes: Record<string, SimpleConfig> = {
    warm: { color: 'orange', bg: 'peach' },
    cool: { color: 'blue', bg: 'lightblue' },
  };
  return themes[name];
}

describe('createComponentThemeResolver', () => {
  it('returns a resolver function', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    expect(typeof resolver).toBe('function');
  });

  it('resolves CSS for a known theme', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    expect(resolver('warm')).toBe(':root { --color: orange; }');
  });

  it('uses the provided selector', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
      selector: 'html:root',
    });
    expect(resolver('warm')).toBe('html:root { --color: orange; }');
  });

  it('returns undefined when getThemeByName returns undefined', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: () => undefined,
      createThemeCss: createSimpleCss,
    });
    expect(resolver('nonexistent')).toBeUndefined();
  });

  it('returns undefined when createThemeCss returns undefined', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: () => ({ bg: 'peach' }), // no color → createSimpleCss returns undefined
      createThemeCss: createSimpleCss,
    });
    expect(resolver('warm')).toBeUndefined();
  });

  it('uses :root as the default selector', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    expect(resolver('warm')).toContain(':root');
  });
});

describe('createComponentsThemeCss', () => {
  it('returns combined CSS from all resolvers', () => {
    const resolver1 = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
      selector: 'html:root',
    });
    const resolver2 = createComponentThemeResolver({
      getThemeByName: (name: string) => (name === 'warm' ? { color: 'coral' } : undefined),
      createThemeCss: createSimpleCss,
      selector: 'html:root',
    });
    const css = createComponentsThemeCss('warm', [resolver1, resolver2]);
    expect(css).toBe('html:root { --color: orange; }\nhtml:root { --color: coral; }');
  });

  it('skips resolvers that return undefined', () => {
    const goodResolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    const badResolver = createComponentThemeResolver({
      getThemeByName: () => undefined,
      createThemeCss: createSimpleCss,
    });
    const css = createComponentsThemeCss('warm', [badResolver, goodResolver, badResolver]);
    expect(css).toBe(':root { --color: orange; }');
  });

  it('returns undefined when all resolvers return undefined', () => {
    const badResolver = createComponentThemeResolver({
      getThemeByName: () => undefined,
      createThemeCss: createSimpleCss,
    });
    expect(createComponentsThemeCss('warm', [badResolver])).toBeUndefined();
  });

  it('returns undefined for an empty resolvers array', () => {
    expect(createComponentsThemeCss('warm', [])).toBeUndefined();
  });

  it('handles a single resolver', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    const css = createComponentsThemeCss('warm', [resolver]);
    expect(css).toBe(':root { --color: orange; }');
  });

  it('handles multiple themes correctly', () => {
    const resolver = createComponentThemeResolver({
      getThemeByName: getSimpleTheme,
      createThemeCss: createSimpleCss,
    });
    const warmCss = createComponentsThemeCss('warm', [resolver]);
    const coolCss = createComponentsThemeCss('cool', [resolver]);
    expect(warmCss).toContain('orange');
    expect(coolCss).toContain('blue');
    expect(warmCss).not.toBe(coolCss);
  });
});
