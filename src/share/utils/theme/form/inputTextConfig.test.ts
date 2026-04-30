import type { InputTextPassThrough } from '@/types/theme/form/inputText';

import { createThemeCss } from '@utils/theme/themeCss';
import { createInputFieldStyleVars } from '@utils/theme/form/inputFieldConfig';
import { createInputTextStyleVars, mergeInputTextPassThrough } from '@utils/theme/form/inputTextConfig';

describe('mergeInputTextPassThrough', () => {
  it('merges each part independently', () => {
    const base: InputTextPassThrough = {
      wrapper: { class: 'base-wrapper', 'data-kind': 'base' },
      input: { class: 'base-input' },
    };
    const override: InputTextPassThrough = {
      wrapper: { class: 'override-wrapper', style: 'border-color: red;' },
      label: { class: 'custom-label' },
    };

    expect(mergeInputTextPassThrough(base, override)).toEqual({
      root: undefined,
      wrapper: {
        class: ['base-wrapper', 'override-wrapper'],
        style: 'border-color: red',
        'data-kind': 'base',
      },
      input: { class: ['base-input'] },
      label: { class: ['custom-label'] },
      icon: undefined,
      helpText: undefined,
      errorText: undefined,
    });
  });
});

describe('createInputFieldStyleVars', () => {
  it('creates CSS custom property declarations for shared field parts', () => {
    expect(
      createInputFieldStyleVars({
        wrapper: {
          backgroundColor: 'pink',
          borderColor: 'tomato',
        },
        label: {
          activeColor: 'black',
        },
      }),
    ).toBe(
      '--input-field-wrapper-background: pink; --input-field-wrapper-border-color: tomato; --input-field-label-active-color: black',
    );
  });

  it('creates focus ring declarations when provided', () => {
    expect(
      createInputFieldStyleVars({
        wrapper: {
          focusRingColor: '#98cbff',
          focusRingWidth: '0.1875rem',
        },
      }),
    ).toBe(
      '--input-field-wrapper-focus-ring-color: #98cbff; --input-field-wrapper-focus-ring-width: 0.1875rem',
    );
  });

  it('creates invalid and valid ring/border color declarations when provided', () => {
    expect(
      createInputFieldStyleVars({
        wrapper: {
          invalidRingColor: '#fecaca',
          validBorderColor: '#88e788',
          validRingColor: '#d1fadf',
        },
      }),
    ).toBe(
      '--input-field-wrapper-invalid-ring-color: #fecaca; --input-field-wrapper-valid-border-color: #88e788; --input-field-wrapper-valid-ring-color: #d1fadf',
    );
  });

  it('returns undefined when no shared declarations are produced', () => {
    expect(createInputFieldStyleVars({})).toBeUndefined();
  });
});

describe('createInputTextStyleVars', () => {
  it('creates CSS custom property declarations for text-control-specific parts', () => {
    expect(
      createInputTextStyleVars({
        input: {
          color: 'navy',
          placeholderColor: 'gray',
        },
      }),
    ).toBe('--input-control-input-color: navy; --input-control-input-placeholder-color: gray');
  });

  it('returns undefined when no declarations are produced', () => {
    expect(createInputTextStyleVars({})).toBeUndefined();
  });
});

describe('createThemeCss', () => {
  it('creates a CSS rule scoped to the given selector', () => {
    const styleVars = createInputFieldStyleVars({
      wrapper: {
        backgroundColor: 'pink',
      },
    });

    expect(
      createThemeCss([styleVars], 'html[data-ui-theme="warm"]'),
    ).toBe('html[data-ui-theme="warm"] { --input-field-wrapper-background: pink; }');
  });

  it('merges multiple style-var blocks into one CSS rule', () => {
    expect(
      createThemeCss(
        ['--input-text-wrapper-background: pink', '--button-border-color: tomato'],
        'html[data-ui-theme="warm"]',
      ),
    ).toBe(
      'html[data-ui-theme="warm"] { --input-text-wrapper-background: pink; --button-border-color: tomato; }',
    );
  });
});
