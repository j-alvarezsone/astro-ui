export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function toFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
}

export function applyToRadioNodeList(list: RadioNodeList, value: unknown): void {
  const stringValue = toFieldValue(value);
  for (const node of list) {
    if (!(node instanceof HTMLInputElement)) continue;
    const checked = node.type === 'radio' ? node.value === stringValue : Boolean(value);
    node.checked = checked;
    node.defaultChecked = checked;
  }
}

export function applyToElement(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: unknown,
): void {
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    const checked = Boolean(value);
    el.checked = checked;
    el.defaultChecked = checked;
  } else if (el instanceof HTMLSelectElement) {
    el.value = toFieldValue(value);
    for (const option of el.options) {
      option.defaultSelected = option.selected;
    }
  } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const stringValue = toFieldValue(value);
    el.value = stringValue;
    el.defaultValue = stringValue;
  }
}

export function populateForm(form: HTMLFormElement, values: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(values)) {
    const el = form.elements.namedItem(name);
    if (el === null) continue;

    if (el instanceof RadioNodeList) {
      applyToRadioNodeList(el, value);
    } else if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      applyToElement(el, value);
    }
  }
}

class FormControl extends HTMLElement {
  connectedCallback(): void {
    const form = this.querySelector('form');
    if (!form?.dataset.initialValues) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(form.dataset.initialValues);
    } catch {
      return;
    }

    if (isRecord(parsed)) {
      populateForm(form, parsed);
    }
  }
}

customElements.define('form-control', FormControl);
