import { createThemeCss } from '@utils/theme/themeCss';

describe('createThemeCss', () => {
  describe('with no valid declarations', () => {
    it('returns undefined for an empty array', () => {
      expect(createThemeCss([])).toBeUndefined();
    });

    it('returns undefined when all values are null', () => {
      expect(createThemeCss([null, null])).toBeUndefined();
    });

    it('returns undefined when all values are undefined', () => {
      expect(createThemeCss([undefined, undefined])).toBeUndefined();
    });

    it('returns undefined when all values are empty strings', () => {
      expect(createThemeCss(['', '   '])).toBeUndefined();
    });

    it('returns undefined when values are mixed nullish and empty', () => {
      expect(createThemeCss([null, undefined, '', '  '])).toBeUndefined();
    });
  });

  describe('with valid declarations', () => {
    it('creates a CSS rule with the default :root selector', () => {
      const css = createThemeCss(['--color: red']);
      expect(css).toBe(':root { --color: red; }');
    });

    it('creates a CSS rule with a custom selector', () => {
      const css = createThemeCss(['--color: red'], 'html[data-ui-theme="warm"]');
      expect(css).toBe('html[data-ui-theme="warm"] { --color: red; }');
    });

    it('creates a CSS rule with the html:root selector', () => {
      const css = createThemeCss(['--input-bg: white'], 'html:root');
      expect(css).toBe('html:root { --input-bg: white; }');
    });

    it('merges multiple declarations into one rule', () => {
      const css = createThemeCss([
        '--input-text-wrapper-background: #fff7ed',
        '--button-border-color: tomato',
      ]);
      expect(css).toBe(':root { --input-text-wrapper-background: #fff7ed; --button-border-color: tomato; }');
    });

    it('strips trailing semicolons from declarations', () => {
      const css = createThemeCss(['--color: red;', '--bg: blue;;;']);
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });

    it('trims whitespace from declarations', () => {
      const css = createThemeCss(['  --color: red  ', '  --bg: blue  ']);
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });

    it('ignores null and undefined values among valid ones', () => {
      const css = createThemeCss([null, '--color: red', undefined, '--bg: blue', null]);
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });

    it('ignores empty string values among valid ones', () => {
      const css = createThemeCss(['--color: red', '', '  ', '--bg: blue']);
      expect(css).toBe(':root { --color: red; --bg: blue; }');
    });

    it('handles a single valid declaration among many nullish values', () => {
      const css = createThemeCss([null, undefined, '--only: value', null]);
      expect(css).toBe(':root { --only: value; }');
    });
  });
});
