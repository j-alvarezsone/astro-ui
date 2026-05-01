import { createButtonStyleVars } from '@utils/theme/buttonConfig';

describe('createButtonStyleVars', () => {
  it('returns undefined for undefined config', () => {
    expect(createButtonStyleVars(undefined)).toBeUndefined();
  });

  it('returns undefined for empty config object', () => {
    expect(createButtonStyleVars({})).toBeUndefined();
  });

  it('returns undefined when all provided values are empty strings', () => {
    expect(
      createButtonStyleVars({
        root: {
          gap: '',
          borderWidth: '',
          borderRadius: '',
          roundedBorderRadius: '',
          smPaddingBlock: '',
          smPaddingInline: '',
          mdPaddingBlock: '',
          mdPaddingInline: '',
          lgPaddingBlock: '',
          lgPaddingInline: '',
          primaryBackgroundColor: '',
          primaryColor: '',
          primaryBorderColor: '',
          primaryHoverBackgroundColor: '',
          secondaryBackgroundColor: '',
          secondaryColor: '',
          secondaryBorderColor: '',
          secondaryHoverBackgroundColor: '',
          contrastBackgroundColor: '',
          contrastColor: '',
          contrastBorderColor: '',
          contrastHoverBackgroundColor: '',
          successBackgroundColor: '',
          successColor: '',
          successBorderColor: '',
          successHoverBackgroundColor: '',
          warningBackgroundColor: '',
          warningColor: '',
          warningBorderColor: '',
          warningHoverBackgroundColor: '',
          dangerBackgroundColor: '',
          dangerColor: '',
          dangerBorderColor: '',
          dangerHoverBackgroundColor: '',
          disabledBackgroundColor: '',
          disabledColor: '',
          disabledBorderColor: '',
          linkDisabledColor: '',
          linkDisabledOpacity: '',
          focusRingWidth: '',
          primaryFocusRingColor: '',
          secondaryFocusRingColor: '',
          contrastFocusRingColor: '',
          successFocusRingColor: '',
          warningFocusRingColor: '',
          dangerFocusRingColor: '',
        },
        icon: {
          color: '',
        },
        label: {
          smFontSize: '',
          mdFontSize: '',
          lgFontSize: '',
          loadingOpacity: '',
        },
        loader: {
          color: '',
        },
      }),
    ).toBeUndefined();
  });

  it('creates a declaration for a single root value', () => {
    expect(createButtonStyleVars({ root: { gap: '0.5rem' } })).toBe('--button-gap: 0.5rem');
  });

  it('creates declarations for all slots in the expected order', () => {
    expect(
      createButtonStyleVars({
        root: {
          gap: '0.5rem',
          borderWidth: '0.125rem',
          borderRadius: '0.5rem',
          roundedBorderRadius: '9999px',
          smPaddingBlock: '0.375rem',
          smPaddingInline: '0.625rem',
          mdPaddingBlock: '0.5rem',
          mdPaddingInline: '0.75rem',
          lgPaddingBlock: '0.625rem',
          lgPaddingInline: '0.875rem',
          primaryBackgroundColor: '#2563eb',
          primaryColor: '#ffffff',
          primaryBorderColor: '#1d4ed8',
          primaryHoverBackgroundColor: '#1d4ed8',
          secondaryBackgroundColor: '#64748b',
          secondaryColor: '#ffffff',
          secondaryBorderColor: '#475569',
          secondaryHoverBackgroundColor: '#475569',
          contrastBackgroundColor: '#111827',
          contrastColor: '#ffffff',
          contrastBorderColor: '#000000',
          contrastHoverBackgroundColor: '#030712',
          successBackgroundColor: '#16a34a',
          successColor: '#ffffff',
          successBorderColor: '#15803d',
          successHoverBackgroundColor: '#15803d',
          warningBackgroundColor: '#f59e0b',
          warningColor: '#111827',
          warningBorderColor: '#d97706',
          warningHoverBackgroundColor: '#d97706',
          dangerBackgroundColor: '#dc2626',
          dangerColor: '#ffffff',
          dangerBorderColor: '#b91c1c',
          dangerHoverBackgroundColor: '#b91c1c',
          disabledBackgroundColor: '#e5e7eb',
          disabledColor: '#6b7280',
          disabledBorderColor: '#d1d5db',
          linkDisabledColor: '#9ca3af',
          linkDisabledOpacity: '0.8',
          focusRingWidth: '0.125rem',
          primaryFocusRingColor: '#93c5fd',
          secondaryFocusRingColor: '#93c5fd',
          contrastFocusRingColor: '#94a3b8',
          successFocusRingColor: '#86efac',
          warningFocusRingColor: '#fde68a',
          dangerFocusRingColor: '#fca5a5',
        },
        icon: {
          color: '#ffffff',
        },
        label: {
          smFontSize: '0.875rem',
          mdFontSize: '1rem',
          lgFontSize: '1.125rem',
          loadingOpacity: '0',
        },
        loader: {
          color: '#ffffff',
        },
      }),
    ).toBe(
      '--button-gap: 0.5rem; --button-border-width: 0.125rem; --button-border-radius: 0.5rem; --button-rounded-border-radius: 9999px; --button-sm-padding-block: 0.375rem; --button-sm-padding-inline: 0.625rem; --button-md-padding-block: 0.5rem; --button-md-padding-inline: 0.75rem; --button-lg-padding-block: 0.625rem; --button-lg-padding-inline: 0.875rem; --button-primary-background-color: #2563eb; --button-primary-color: #ffffff; --button-primary-border-color: #1d4ed8; --button-primary-hover-background-color: #1d4ed8; --button-secondary-background-color: #64748b; --button-secondary-color: #ffffff; --button-secondary-border-color: #475569; --button-secondary-hover-background-color: #475569; --button-contrast-background-color: #111827; --button-contrast-color: #ffffff; --button-contrast-border-color: #000000; --button-contrast-hover-background-color: #030712; --button-success-background-color: #16a34a; --button-success-color: #ffffff; --button-success-border-color: #15803d; --button-success-hover-background-color: #15803d; --button-warning-background-color: #f59e0b; --button-warning-color: #111827; --button-warning-border-color: #d97706; --button-warning-hover-background-color: #d97706; --button-danger-background-color: #dc2626; --button-danger-color: #ffffff; --button-danger-border-color: #b91c1c; --button-danger-hover-background-color: #b91c1c; --button-disabled-background-color: #e5e7eb; --button-disabled-color: #6b7280; --button-disabled-border-color: #d1d5db; --button-link-disabled-color: #9ca3af; --button-link-disabled-opacity: 0.8; --button-focus-ring-width: 0.125rem; --button-primary-focus-ring-color: #93c5fd; --button-secondary-focus-ring-color: #93c5fd; --button-contrast-focus-ring-color: #94a3b8; --button-success-focus-ring-color: #86efac; --button-warning-focus-ring-color: #fde68a; --button-danger-focus-ring-color: #fca5a5; --button-icon-color: #ffffff; --button-label-sm-font-size: 0.875rem; --button-label-md-font-size: 1rem; --button-label-lg-font-size: 1.125rem; --button-label-loading-opacity: 0; --button-loader-color: #ffffff',
    );
  });

  it('omits undefined and empty-string values while preserving defined declarations', () => {
    expect(
      createButtonStyleVars({
        root: {
          gap: '0.5rem',
          borderWidth: '',
          primaryBackgroundColor: '#2563eb',
        },
        icon: {
          color: '',
        },
      }),
    ).toBe(
      '--button-gap: 0.5rem; --button-primary-background-color: #2563eb',
    );
  });
});
