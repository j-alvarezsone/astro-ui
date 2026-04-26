import type { UIThemeComponentName, UIThemeComponents } from '@utils/theme/uiThemes';
import { createChipsStyleVars } from '@utils/theme/misc/chipsConfig';
import { createThemeCssFromStyleVars } from '@utils/theme/createThemeCssFromStyleVars';
import { createInputFieldStyleVars } from '@utils/theme/form/inputFieldConfig';
import { createInputTextStyleVars } from '@utils/theme/form/inputTextConfig';

/**
 * Per-component CSS creator map.
 * Each key maps to the CSS custom-property generator for that component's theme config.
 * Adding a new themed component requires a new entry here.
 */
export type ComponentThemeCssMap = {
  readonly [K in UIThemeComponentName]: (
    config: UIThemeComponents[K] | undefined,
    selector?: string,
  ) => string | undefined;
};

export const componentThemeCssMap: ComponentThemeCssMap = {
  inputText: createThemeCssFromStyleVars([createInputFieldStyleVars, createInputTextStyleVars]),
  chips: createThemeCssFromStyleVars(createChipsStyleVars),
};
