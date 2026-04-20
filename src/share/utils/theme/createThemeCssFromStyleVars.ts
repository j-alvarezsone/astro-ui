import type { Maybe } from '@/types/index';

import { createThemeCss } from '@utils/theme/themeCss';

type StyleVarsOutput = Maybe<string>;
type CreateStyleVars<TConfig> = (config: TConfig | undefined) => StyleVarsOutput;

/**
 * Adapts one or many style-vars creators to the `createThemeCss` signature expected by resolvers.
 *
 * @param createStyleVars - A single style-vars creator or a list of creators.
 * @returns A function that builds scoped theme CSS from component config.
 */
export function createThemeCssFromStyleVars<TConfig>(
  createStyleVars: CreateStyleVars<TConfig> | CreateStyleVars<TConfig>[],
): (config: TConfig | undefined, selector?: string) => string | undefined {
  const createStyleVarsList = Array.isArray(createStyleVars) ? createStyleVars : [createStyleVars];

  return function resolveThemeCss(config: TConfig | undefined, selector?: string): string | undefined {
    const styleVars = createStyleVarsList.map((createVars) => createVars(config));

    return createThemeCss(styleVars, selector);
  };
}
