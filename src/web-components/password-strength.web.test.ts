import { evaluatePasswordRules, getStrengthState } from './password-strength.web.ts';
import './password-strength.web.ts';

function mountPasswordStrength(): {
  wrapper: HTMLElement;
  container: HTMLElement;
  fieldWrapper: HTMLElement;
  panel: HTMLElement;
  input: HTMLInputElement;
  strength: HTMLElement;
  label: HTMLElement;
  meter: HTMLElement;
  hints: NodeListOf<HTMLElement>;
} {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <input-password>
      <div class="input-field">
        <div class="input-field__wrapper">
          <input id="password" class="input-password" type="password" value="" />
        </div>
      </div>
      <password-strength
        data-input-id="password"
        data-label-weak="Weak"
        data-label-medium="Medium"
        data-label-strong="Strong"
        data-visible-on-focus="true"
        data-open="false"
        data-placement="bottom"
        data-strength="empty"
      >
        <div class="password-strength__panel">
          <p class="password-strength__label">Enter a password</p>
          <div data-strength-meter role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" aria-valuetext="Enter a password"></div>
          <ul>
            <li data-rule-id="lower" data-rule-pattern="[a-z]">At least one lowercase</li>
            <li data-rule-id="upper" data-rule-pattern="[A-Z]">At least one uppercase</li>
            <li data-rule-id="number" data-rule-pattern="\\d">At least one numeric</li>
            <li data-rule-id="special" data-rule-pattern="[^\\w\\s]">At least one special character</li>
            <li data-rule-id="length" data-rule-min-length="8">Minimum 8 characters</li>
          </ul>
        </div>
      </password-strength>
    </input-password>
    <input id="custom-password" class="input-password" type="password" value="" pattern="(?=.*[@$!%*?&]).{8,}" />
    <password-strength
      data-input-id="custom-password"
      data-label-weak="Weak"
      data-label-medium="Medium"
      data-label-strong="Strong"
      data-visible-on-focus="true"
      data-open="false"
      data-placement="bottom"
      data-strength="empty"
      data-strength-custom="true"
    >
      <div class="password-strength__panel">
        <p class="password-strength__label">Enter a password</p>
        <div data-strength-meter role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" aria-valuetext="Enter a password"></div>
        <ul>
          <li data-rule-id="match-input-pattern" data-rule-use-input-pattern="true">Must match input pattern</li>
        </ul>
      </div>
    </password-strength>
  `;

  document.body.appendChild(wrapper);

  const input = wrapper.querySelector<HTMLInputElement>('.input-password');
  const container = wrapper.querySelector<HTMLElement>('input-password');
  const fieldWrapper = wrapper.querySelector<HTMLElement>('.input-field__wrapper');
  const strength = wrapper.querySelector<HTMLElement>('password-strength');
  const label = wrapper.querySelector<HTMLElement>('.password-strength__label');
  const meter = wrapper.querySelector<HTMLElement>('[data-strength-meter]');
  const panel = wrapper.querySelector<HTMLElement>('.password-strength__panel');

  if (!input || !container || !fieldWrapper || !strength || !label || !meter || !panel) {
    throw new Error('Failed to mount password-strength fixture');
  }

  const hints = wrapper.querySelectorAll<HTMLElement>('[data-rule-id]');
  Object.defineProperty(panel, 'scrollHeight', { value: 120, configurable: true });

  return { wrapper, container, fieldWrapper, panel, input, strength, label, meter, hints };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('evaluatePasswordRules', () => {
  it('matches all rules for a strong password', () => {
    expect(evaluatePasswordRules('Abcdef1!')).toEqual({
      hasLower: true,
      hasUpper: true,
      hasNumber: true,
      hasSpecial: true,
      hasMinLength: true,
    });
  });

  it('fails every rule for an empty value', () => {
    expect(evaluatePasswordRules('')).toEqual({
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
      hasMinLength: false,
    });
  });
});

describe('getStrengthState', () => {
  const labels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  it('returns empty for no value', () => {
    const state = getStrengthState('', labels);

    expect(state.level).toBe('empty');
    expect(state.value).toBe(0);
    expect(state.label).toBe('');
  });

  it('returns weak for low-score passwords', () => {
    const state = getStrengthState('abc', labels);

    expect(state.level).toBe('weak');
    expect(state.value).toBe(1);
    expect(state.label).toBe('Weak');
  });

  it('returns medium for mid-score passwords', () => {
    const state = getStrengthState('Abcdef12', labels);

    expect(state.level).toBe('medium');
    expect(state.value).toBe(2);
    expect(state.label).toBe('Medium');
  });

  it('returns strong for high-score passwords', () => {
    const state = getStrengthState('Abcdef12!', labels);

    expect(state.level).toBe('strong');
    expect(state.value).toBe(3);
    expect(state.label).toBe('Strong');
  });
});

describe('PasswordStrength element', () => {
  it('updates meter semantics on input', () => {
    const { input, strength, label, meter } = mountPasswordStrength();

    input.value = 'Abcdef12!';
    input.dispatchEvent(new Event('input'));

    expect(strength.dataset.strength).toBe('strong');
    expect(label.textContent).toBe('Enter a password');
    expect(meter.getAttribute('aria-valuenow')).toBe('3');
    expect(meter.getAttribute('aria-valuetext')).toBe('Strong');
  });

  it('updates hint pass states based on input rules', () => {
    const { input, hints } = mountPasswordStrength();

    input.value = 'Abcdef12';
    input.dispatchEvent(new Event('input'));

    const byRule = new Map(Array.from(hints).map((node) => [node.dataset.ruleId, node.dataset.passed]));
    expect(byRule.get('lower')).toBe('true');
    expect(byRule.get('upper')).toBe('true');
    expect(byRule.get('number')).toBe('true');
    expect(byRule.get('special')).toBe('false');
    expect(byRule.get('length')).toBe('true');
  });

  it('supports custom rules based on input pattern', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <input-password>
        <div class="input-field">
          <div class="input-field__wrapper">
            <input id="custom-password" class="input-password" type="password" value="" pattern="(?=.*[@$!%*?&]).{8,}" />
          </div>
        </div>
        <password-strength data-input-id="custom-password" data-label-weak="Weak" data-label-medium="Medium" data-label-strong="Strong" data-open="false">
          <div class="password-strength__panel">
            <p class="password-strength__label">Enter a password</p>
            <div data-strength-meter role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" aria-valuetext="Enter a password"></div>
            <ul>
              <li data-rule-id="match-input-pattern" data-rule-use-input-pattern="true">Must match input pattern</li>
            </ul>
          </div>
        </password-strength>
      </input-password>
    `;

    document.body.appendChild(wrapper);

    const input = wrapper.querySelector<HTMLInputElement>('#custom-password');
    const strength = wrapper.querySelector<HTMLElement>('password-strength');
    const hint = wrapper.querySelector<HTMLElement>('[data-rule-id="match-input-pattern"]');

    if (!input || !strength || !hint) {
      throw new Error('Failed to mount custom-rule fixture');
    }

    input.value = 'Abcdef12';
    input.dispatchEvent(new Event('input'));
    expect(hint.dataset.passed).toBe('false');
    expect(strength.dataset.strength).toBe('weak');

    input.value = 'Abcdef12!';
    input.dispatchEvent(new Event('input'));
    expect(hint.dataset.passed).toBe('true');
    expect(strength.dataset.strength).toBe('strong');
  });

  it('opens on focus and closes on blur when visibility is focus-bound', () => {
    const { input, strength } = mountPasswordStrength();

    input.dispatchEvent(new FocusEvent('focus'));
    expect(strength.dataset.open).toBe('true');

    input.dispatchEvent(new FocusEvent('blur'));
    expect(strength.dataset.open).toBe('false');
  });

  it('flips placement to top when there is not enough space below', () => {
    const { input, strength, container, fieldWrapper } = mountPasswordStrength();

    Object.defineProperty(window, 'innerHeight', { value: 740, configurable: true });
    Object.defineProperty(container, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 600,
        bottom: 720,
        left: 0,
        right: 0,
        width: 320,
        height: 120,
        x: 0,
        y: 600,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(fieldWrapper, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 620,
        bottom: 660,
        left: 0,
        right: 320,
        width: 320,
        height: 40,
        x: 0,
        y: 620,
        toJSON: () => ({}),
      }),
    });

    input.dispatchEvent(new FocusEvent('focus'));

    expect(strength.dataset.placement).toBe('top');
  });

  it('keeps placement on bottom when there is enough space below', () => {
    const { input, strength, container, fieldWrapper } = mountPasswordStrength();

    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 160,
        bottom: 320,
        left: 0,
        right: 0,
        width: 320,
        height: 160,
        x: 0,
        y: 160,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(fieldWrapper, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 220,
        bottom: 260,
        left: 0,
        right: 320,
        width: 320,
        height: 40,
        x: 0,
        y: 220,
        toJSON: () => ({}),
      }),
    });

    input.dispatchEvent(new FocusEvent('focus'));

    expect(strength.dataset.placement).toBe('bottom');
  });

  it('cleans up listeners on disconnect', () => {
    const { wrapper, input, strength, label } = mountPasswordStrength();

    wrapper.remove();
    input.value = 'Abcdef12!';
    input.dispatchEvent(new Event('input'));

    expect(strength.dataset.strength).toBe('empty');
    expect(label.textContent).toBe('Enter a password');
  });
});
