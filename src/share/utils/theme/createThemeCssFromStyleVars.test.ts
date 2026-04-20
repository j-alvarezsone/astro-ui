import type { Maybe } from '@/types/index';

import { createThemeCssFromStyleVars } from '@utils/theme/createThemeCssFromStyleVars';

interface ExampleConfig {
  color?: string;
  bg?: string;
}

function createColorVar(config: ExampleConfig | undefined): Maybe<string> {
  return config?.color ? `--color: ${config.color}` : undefined;
}

function createBgVar(config: ExampleConfig | undefined): Maybe<string> {
  return config?.bg ? `--bg: ${config.bg}` : undefined;
}

function createNullVar(_config: ExampleConfig | undefined): Maybe<string> {
  return null;
}

describe('createThemeCssFromStyleVars', () => {
  describe('with a single creator', () => {
    it('returns a resolver function', () => {
      const resolver = createThemeCssFromStyleVars(createColorVar);
      expect(typeof resolver).toBe('function');
    });

    it('generates CSS from a single creator', () => {
      const resolver = createThemeCssFromStyleVars(createColorVar);
      const css = resolver({ color: 'red' });
      expect(css).toBe(':root { --color: red; }');
    });

    it('uses the provided selector', () => {
      const resolver = createThemeCssFromStyleVars(createColorVar);
      const css = resolver({ color: 'red' }, 'html:root');
      expect(css).toBe('html:root { --color: red; }');
    });

    it('returns undefined when the creator returns undefined', () => {
      const resolver = createThemeCssFromStyleVars(createColorVar);
      expect(resolver({})).toBeUndefined();
    });

    it('returns undefined when config is undefined', () => {
      const resolver = createThemeCssFromStyleVars(createColorVar);
      expect(resolver(undefined)).toBeUndefined();
    });

    it('passes a single creator wrapped in array the same way', () => {
      const singleResolver = createThemeCssFromStyleVars(createColorVar);
      const arrayResolver = createThemeCssFromStyleVars([createColorVar]);
      const config = { color: 'green' };
      expect(singleResolver(config)).toBe(arrayResolver(config));
    });
  });

  describe('with multiple creators', () => {
    it('returns a resolver function', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      expect(typeof resolver).toBe('function');
    });

    it('merges output from multiple creators into one CSS rule', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      const css = resolver({ color: 'red', bg: 'blue' });
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });

    it('only includes declarations from creators that produce output', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      const css = resolver({ color: 'red' });
      expect(css).toBe(':root { --color: red; }');
    });

    it('returns undefined when all creators produce no output', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      expect(resolver({})).toBeUndefined();
    });

    it('returns undefined when config is undefined for all creators', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      expect(resolver(undefined)).toBeUndefined();
    });

    it('uses the provided selector for the merged rule', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createBgVar]);
      const css = resolver({ color: 'red', bg: 'blue' }, 'html[data-ui-theme="warm"]');
      expect(css).toBe('html[data-ui-theme="warm"] { --color: red; --bg: blue; }');
    });

    it('handles three creators, one returning null', () => {
      const resolver = createThemeCssFromStyleVars([createColorVar, createNullVar, createBgVar]);
      const css = resolver({ color: 'red', bg: 'blue' });
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });
  });
});
