const DEFAULT_INPUT_SELECTOR = '.input-password' as const;
const METER_SELECTOR = '[data-strength-meter]' as const;
const HINT_SELECTOR = '[data-rule-id]' as const;

type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

interface PasswordRulesState {
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasMinLength: boolean;
}

interface StrengthState {
  level: StrengthLevel;
  value: number;
  label: string;
}

interface StrengthLabels {
  weak: string;
  medium: string;
  strong: string;
}

/**
 * Computes password rule matches used by both hints and final strength scoring.
 *
 * @param value Password string from the connected input.
 * @returns Rule flags for lowercase, uppercase, number, special character, and minimum length.
 * @example
 * ```ts
 * const rules = evaluatePasswordRules('Abc123!@');
 * // rules.hasLower === true
 * // rules.hasUpper === true
 * // rules.hasNumber === true
 * // rules.hasSpecial === true
 * // rules.hasMinLength === true
 * ```
 */
function evaluatePasswordRules(value: string): PasswordRulesState {
  return {
    hasLower: /[a-z]/.test(value),
    hasUpper: /[A-Z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^\w\s]/.test(value),
    hasMinLength: value.length >= 8,
  };
}

/**
 * Derives a normalized strength state from a password value and default rules.
 *
 * @param value Password string from the connected input.
 * @param labels Localized labels for weak, medium, and strong levels.
 * @returns Render-ready strength state including level, meter value, label, and rules.
 * @example
 * ```ts
 * const state = getStrengthState('Abc123!@', {
 *   weak: 'Weak',
 *   medium: 'Medium',
 *   strong: 'Strong',
 * });
 * // state.level === 'strong'
 * // state.value === 3
 * ```
 */
function getStrengthState(value: string, labels: StrengthLabels): StrengthState {
  const rules = evaluatePasswordRules(value);

  if (!value) {
    return {
      level: 'empty',
      value: 0,
      label: '',
    };
  }

  const score =
    Number(rules.hasLower) +
    Number(rules.hasUpper) +
    Number(rules.hasNumber) +
    Number(rules.hasSpecial) +
    Number(rules.hasMinLength);

  if (score <= 2) {
    return {
      level: 'weak',
      value: 1,
      label: labels.weak,
    };
  }

  if (score <= 4) {
    return {
      level: 'medium',
      value: 2,
      label: labels.medium,
    };
  }

  return {
    level: 'strong',
    value: 3,
    label: labels.strong,
  };
}

/**
 * Converts matched rule counts into weak/medium/strong levels.
 *
 * @param value Password string from the connected input.
 * @param passedCount Number of validation rules currently passing.
 * @param totalCount Total number of active validation rules.
 * @param labels Localized labels for weak, medium, and strong levels.
 * @returns Render-ready strength level metadata.
 * @example
 * ```ts
 * const result = getStrengthFromCounts('Abcdef12', 4, 5, {
 *   weak: 'Weak',
 *   medium: 'Medium',
 *   strong: 'Strong',
 * });
 * // result.level === 'medium'
 * ```
 */
function getStrengthFromCounts(
  value: string,
  passedCount: number,
  totalCount: number,
  labels: StrengthLabels,
): { level: StrengthLevel; value: number; label: string } {
  if (!value) {
    return { level: 'empty', value: 0, label: '' };
  }

  if (totalCount <= 0) {
    return { level: 'weak', value: 1, label: labels.weak };
  }

  if (passedCount >= totalCount) {
    return { level: 'strong', value: 3, label: labels.strong };
  }

  const mediumThreshold = Math.max(1, Math.ceil(totalCount * 0.6));
  if (passedCount >= mediumThreshold) {
    return { level: 'medium', value: 2, label: labels.medium };
  }

  return { level: 'weak', value: 1, label: labels.weak };
}

/**
 * Creates a RegExp from rule metadata and gracefully handles invalid patterns.
 *
 * @param source Regex source string from rule attributes or input pattern.
 * @param fullMatch Whether the pattern should match the whole value.
 * @returns Compiled regular expression or null when source is invalid.
 * @example
 * ```ts
 * const regex = safeCreateRegExp('[A-Z]', false);
 * // regex?.test('A') === true
 * ```
 */
function safeCreateRegExp(source: string, fullMatch: boolean): RegExp | null {
  if (!source) return null;

  try {
    return fullMatch ? new RegExp(`^(?:${source})$`) : new RegExp(source);
  } catch {
    return null;
  }
}

class PasswordStrength extends HTMLElement {
  #controller: AbortController | null = null;
  #input: HTMLInputElement | null = null;
  #meter: HTMLElement | null = null;

  connectedCallback(): void {
    this.#controller = new AbortController();
    this.#input = this.#resolveInput();
    this.#meter = this.querySelector(METER_SELECTOR);

    this.#applyStrength();

    if (!this.#input || !this.#controller) return;

    const { signal } = this.#controller;

    this.#input.addEventListener(
      'input',
      () => {
        this.#applyStrength();
        this.#updatePlacement();
      },
      { signal },
    );

    this.#input.addEventListener(
      'focus',
      () => {
        this.#updatePlacement();
        this.#setOpen(true);
      },
      { signal },
    );

    this.#input.addEventListener(
      'blur',
      () => {
        if (!this.#visibleOnFocus()) return;
        this.#setOpen(false);
      },
      { signal },
    );

    window.addEventListener('resize', () => this.#updatePlacement(), { signal });
    window.addEventListener('scroll', () => this.#updatePlacement(), {
      capture: true,
      passive: true,
      signal,
    });
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
    this.#input = null;
    this.#meter = null;
  }

  /**
   * Resolves the password input this component should observe.
   *
   * @param fallbackSelector Selector used when no explicit input id is provided.
   * @returns The resolved password input element or null when not found.
   * @example
   * ```ts
   * const input = element.resolveInput('.input-password');
   * // returns the nearest matching input in the same input-password wrapper
   * ```
   */
  #resolveInput(fallbackSelector: string = DEFAULT_INPUT_SELECTOR): HTMLInputElement | null {
    const inputId = this.dataset.inputId;
    const byId = inputId ? document.getElementById(inputId) : null;
    if (byId instanceof HTMLInputElement) return byId;

    const container = this.closest('input-password') ?? this.parentElement;
    const bySelector = container?.querySelector(fallbackSelector);
    return bySelector instanceof HTMLInputElement ? bySelector : null;
  }

  /**
   * Updates strength labels, aria attributes, and hint completion state.
   *
   * @returns Nothing.
   * @example
   * ```ts
   * element.applyStrength();
   * ```
   */
  #applyStrength(): void {
    const meterEmptyLabel = this.#meter?.dataset.emptyLabel?.trim() ?? '';
    const emptyLabel = meterEmptyLabel || 'Enter a password';

    const labels: StrengthLabels = {
      weak: this.dataset.labelWeak ?? 'Weak',
      medium: this.dataset.labelMedium ?? 'Medium',
      strong: this.dataset.labelStrong ?? 'Strong',
    };

    const value = this.#input?.value ?? '';
    const hintNodes = Array.from(this.querySelectorAll<HTMLElement>(HINT_SELECTOR));

    let strengthLabel: string;
    let strengthLevel: StrengthLevel;
    let strengthValue: number;

    if (!value) {
      strengthLabel = emptyLabel;
      strengthLevel = 'empty';
      strengthValue = 0;
      hintNodes.forEach((hintNode) => {
        hintNode.dataset.passed = 'false';
      });
    } else if (hintNodes.length === 0) {
      const strength = getStrengthState(value, labels);
      strengthLabel = strength.label;
      strengthLevel = strength.level;
      strengthValue = strength.value;
    } else {
      const passedCount = hintNodes.reduce((count, hintNode) => {
        const passed = this.#isHintRulePassed(hintNode, value);
        hintNode.dataset.passed = passed ? 'true' : 'false';
        return count + Number(passed);
      }, 0);

      const customStrength = getStrengthFromCounts(value, passedCount, hintNodes.length, labels);
      strengthLabel = customStrength.label;
      strengthLevel = customStrength.level;
      strengthValue = customStrength.value;
    }

    this.dataset.strength = strengthLevel;

    if (this.#meter) {
      this.#meter.setAttribute('aria-valuenow', String(strengthValue));
      this.#meter.setAttribute('aria-valuetext', strengthLabel);
    }
  }

  /**
   * Evaluates a single hint rule from element data attributes.
   *
   * @param hintElement Hint list item carrying data-rule metadata.
   * @param value Password string from the connected input.
   * @returns True when the rule passes for the provided value.
   * @example
   * ```ts
   * const passed = element.isHintRulePassed(ruleNode, 'Abc123!');
   * // passed === true
   * ```
   */
  #isHintRulePassed(hintElement: HTMLElement, value: string): boolean {
    const ruleMinLength = hintElement.dataset.ruleMinLength;
    const rulePattern = hintElement.dataset.rulePattern;
    const useInputPattern = hintElement.dataset.ruleUseInputPattern === 'true';
    const ruleId = hintElement.dataset.ruleId ?? '';

    let passed = true;
    let hasCustomRule = false;

    if (ruleMinLength) {
      const minLengthValue = Number(ruleMinLength);
      if (!Number.isNaN(minLengthValue)) {
        passed = passed && value.length >= minLengthValue;
        hasCustomRule = true;
      }
    }

    if (rulePattern) {
      const regex = safeCreateRegExp(rulePattern, false);
      passed = passed && (regex ? regex.test(value) : false);
      hasCustomRule = true;
    }

    if (useInputPattern) {
      const inputPattern = this.#input?.getAttribute('pattern') ?? '';
      const regex = safeCreateRegExp(inputPattern, true);
      passed = passed && (regex ? regex.test(value) : false);
      hasCustomRule = true;
    }

    if (hasCustomRule) {
      return passed;
    }

    const defaultRules = evaluatePasswordRules(value);
    if (ruleId === 'lower') return defaultRules.hasLower;
    if (ruleId === 'upper') return defaultRules.hasUpper;
    if (ruleId === 'number') return defaultRules.hasNumber;
    if (ruleId === 'special') return defaultRules.hasSpecial;
    if (ruleId === 'length') return defaultRules.hasMinLength;

    return false;
  }

  /**
   * Sets panel visibility state according to component policy.
   *
   * @param open Whether the panel should be open.
   * @returns Nothing.
   * @example
   * ```ts
   * element.setOpen(true);
   * ```
   */
  #setOpen(open: boolean): void {
    if (!open && !this.#visibleOnFocus()) return;

    this.dataset.open = open ? 'true' : 'false';
  }

  /**
   * Indicates whether the panel should only be shown while input is focused.
   *
   * @returns True when visibility is focus-bound.
   * @example
   * ```ts
   * if (element.visibleOnFocus()) {
   *   // close on blur
   * }
   * ```
   */
  #visibleOnFocus(): boolean {
    return (this.dataset.visibleOnFocus ?? 'true') !== 'false';
  }

  /**
   * Chooses top or bottom placement based on available viewport space and sets
   * CSS custom properties used by the panel's absolute positioning.
   *
   * @returns Nothing.
   * @example
   * ```ts
   * element.updatePlacement();
   * ```
   */
  #updatePlacement(): void {
    const container = this.closest<HTMLElement>('input-password');
    const inputField = this.#input?.closest<HTMLElement>('.input-field');
    const fieldWrapper =
      inputField?.querySelector<HTMLElement>('.input-field__wrapper') ?? this.#input?.parentElement ?? null;

    if (!container || !fieldWrapper) return;

    const panel = this.querySelector<HTMLElement>('.password-strength__panel');
    if (!panel) return;

    const containerRect = container.getBoundingClientRect();
    const wrapperRect = fieldWrapper.getBoundingClientRect();
    const gap = 8;

    const panelHeight = panel.scrollHeight || 200;
    const spaceBelow = window.innerHeight - wrapperRect.bottom;
    const spaceAbove = wrapperRect.top;
    const preferBottom = spaceBelow >= panelHeight + gap || spaceBelow >= spaceAbove;

    if (preferBottom) {
      const topOffset = wrapperRect.bottom - containerRect.top + gap;
      this.dataset.placement = 'bottom';
      this.style.setProperty('--ps-top', `${topOffset}px`);
    } else {
      const topOffset = wrapperRect.top - containerRect.top - gap - panelHeight;
      this.dataset.placement = 'top';
      this.style.setProperty('--ps-top', `${topOffset}px`);
    }
  }
}

customElements.define('password-strength', PasswordStrength);

export { evaluatePasswordRules, getStrengthState };
