export interface InputFieldStyleConfig {
  root?: {
    gap?: string;
  };
  wrapper?: {
    gap?: string;
    backgroundColor?: string;
    borderColor?: string;
    hoverBorderColor?: string;
    focusBorderColor?: string;
    focusRingColor?: string;
    errorBorderColor?: string;
    disabledBackgroundColor?: string;
    borderRadius?: string;
    paddingInline?: string;
  };
  label?: {
    color?: string;
    defaultColor?: string;
    activeColor?: string;
    backgroundColor?: string;
    requiredColor?: string;
    optionalColor?: string;
  };
  icon?: {
    color?: string;
    disabledOpacity?: string | number;
  };
  helpText?: {
    color?: string;
  };
  errorText?: {
    color?: string;
  };
}