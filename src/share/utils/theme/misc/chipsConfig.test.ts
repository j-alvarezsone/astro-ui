import { createChipsStyleVars } from '@utils/theme/misc/chipsConfig';

describe('createChipsStyleVars', () => {
  it('returns undefined for undefined config', () => {
    expect(createChipsStyleVars(undefined)).toBeUndefined();
  });

  it('returns undefined for empty config object', () => {
    expect(createChipsStyleVars({})).toBeUndefined();
  });

  it('returns undefined when all nested values are empty strings', () => {
    expect(
      createChipsStyleVars({
        root: {
          backgroundColor: '',
          borderColor: '',
          color: '',
          borderRadius: '',
          activeBackgroundColor: '',
          activeBorderColor: '',
          activeColor: '',
          focusRingColor: '',
          focusRingOverlayColor: '',
        },
        image: { borderRadius: '' },
      }),
    ).toBeUndefined();
  });

  it('creates a declaration for a single root value', () => {
    expect(createChipsStyleVars({ root: { backgroundColor: '#fff7ed' } })).toBe(
      '--chips-background-color: #fff7ed',
    );
  });

  it('creates declarations for all root values in correct order', () => {
    expect(
      createChipsStyleVars({
        root: {
          backgroundColor: '#fff7ed',
          borderColor: '#fdba74',
          color: '#1a1a1a',
          borderRadius: '8px',
          activeBackgroundColor: '#fb923c',
          activeBorderColor: '#ea580c',
          activeColor: '#fff',
          focusRingColor: '#fb923c',
          focusRingOverlayColor: 'rgba(251,146,60,0.3)',
        },
      }),
    ).toBe(
      '--chips-background-color: #fff7ed; --chips-border-color: #fdba74; --chips-color: #1a1a1a; --chips-border-radius: 8px; --chips-active-background-color: #fb923c; --chips-active-border-color: #ea580c; --chips-active-color: #fff; --chips-focus-ring-color: #fb923c; --chips-focus-ring-overlay-color: rgba(251,146,60,0.3)',
    );
  });

  it('creates a declaration for image.borderRadius', () => {
    expect(createChipsStyleVars({ image: { borderRadius: '4px' } })).toBe(
      '--chips-image-border-radius: 4px',
    );
  });

  it('combines root and image declarations', () => {
    expect(
      createChipsStyleVars({
        root: { backgroundColor: '#fff7ed', activeColor: '#fff' },
        image: { borderRadius: '4px' },
      }),
    ).toBe(
      '--chips-background-color: #fff7ed; --chips-active-color: #fff; --chips-image-border-radius: 4px',
    );
  });

  it('omits undefined root fields', () => {
    expect(
      createChipsStyleVars({
        root: { backgroundColor: '#fff7ed', activeColor: '#fff' },
      }),
    ).toBe('--chips-background-color: #fff7ed; --chips-active-color: #fff');
  });

  it('omits empty-string root fields but includes defined ones', () => {
    expect(
      createChipsStyleVars({
        root: { backgroundColor: '#fff7ed', borderColor: '', activeColor: '#fff' },
      }),
    ).toBe('--chips-background-color: #fff7ed; --chips-active-color: #fff');
  });

  it('creates declarations for focus ring tokens', () => {
    expect(
      createChipsStyleVars({
        root: {
          focusRingColor: '#2563eb',
          focusRingOverlayColor: 'rgba(37,99,235,0.3)',
        },
      }),
    ).toBe(
      '--chips-focus-ring-color: #2563eb; --chips-focus-ring-overlay-color: rgba(37,99,235,0.3)',
    );
  });

  it('returns undefined when only empty sub-configs are provided', () => {
    expect(createChipsStyleVars({ root: {}, image: {}, icon: {}, label: {}, removeIcon: {} })).toBeUndefined();
  });

  it('creates a declaration for icon.color', () => {
    expect(createChipsStyleVars({ icon: { color: '#9a3412' } })).toBe('--chips-icon-color: #9a3412');
  });

  it('creates declarations for label.color, fontWeight and fontSize', () => {
    expect(createChipsStyleVars({ label: { color: '#9a3412', fontWeight: '600', fontSize: '0.875rem' } })).toBe(
      '--chips-label-color: #9a3412; --chips-label-font-weight: 600; --chips-label-font-size: 0.875rem',
    );
  });

  it('creates a declaration for removeIcon.color', () => {
    expect(createChipsStyleVars({ removeIcon: { color: '#ea580c' } })).toBe(
      '--chips-remove-icon-color: #ea580c',
    );
  });

  it('combines all sub-config slots', () => {
    expect(
      createChipsStyleVars({
        root: { backgroundColor: '#fff7ed' },
        image: { borderRadius: '4px' },
        icon: { color: '#9a3412' },
        label: { fontWeight: '600' },
        removeIcon: { color: '#ea580c' },
      }),
    ).toBe(
      '--chips-background-color: #fff7ed; --chips-image-border-radius: 4px; --chips-icon-color: #9a3412; --chips-label-font-weight: 600; --chips-remove-icon-color: #ea580c',
    );
  });
});
