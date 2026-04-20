import { createThemeCssFromStyleVars } from '@utils/theme/createThemeCssFromStyleVars';
import { createInputFieldStyleVars } from '@utils/theme/form/inputFieldConfig';
import { createInputTextStyleVars } from '@utils/theme/form/inputTextConfig';

export const createComponentThemeCss = createThemeCssFromStyleVars([
  createInputFieldStyleVars,
  createInputTextStyleVars,
]);
