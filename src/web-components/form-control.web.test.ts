import {
  applyToElement,
  applyToRadioNodeList,
  isRecord,
  populateForm,
  toFieldValue,
} from './form-control.web';

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function buildForm(html: string): HTMLFormElement {
  const form = document.createElement('form');
  form.innerHTML = html;
  document.body.appendChild(form);
  return form;
}

function getInput(form: HTMLFormElement, name: string): HTMLInputElement {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLInputElement)) throw new Error(`input[name="${name}"] not found`);
  return el;
}

function getTextarea(form: HTMLFormElement, name: string): HTMLTextAreaElement {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLTextAreaElement))
    throw new Error(`textarea[name="${name}"] not found`);
  return el;
}

function getSelect(form: HTMLFormElement, name: string): HTMLSelectElement {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLSelectElement)) throw new Error(`select[name="${name}"] not found`);
  return el;
}

function getRadioList(form: HTMLFormElement, name: string): RadioNodeList {
  const el = form.elements.namedItem(name);
  if (!(el instanceof RadioNodeList)) throw new Error(`RadioNodeList[name="${name}"] not found`);
  return el;
}

function mountCustomElement(innerHtml: string): HTMLElement {
  const el = document.createElement('form-control');
  el.innerHTML = innerHtml;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// isRecord
// ---------------------------------------------------------------------------

describe('isRecord', () => {
  it('returns true for a non-null plain object', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns true for an empty object', () => {
    expect(isRecord({})).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for an array', () => {
    expect(isRecord(['a', 'b'])).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(isRecord([])).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isRecord('hello')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isRecord(42)).toBe(false);
  });

  it('returns false for a boolean', () => {
    expect(isRecord(true)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRecord(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toFieldValue
// ---------------------------------------------------------------------------

describe('toFieldValue', () => {
  it('returns empty string for null', () => {
    expect(toFieldValue(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toFieldValue(undefined)).toBe('');
  });

  it('returns an empty string unchanged', () => {
    expect(toFieldValue('')).toBe('');
  });

  it('returns a non-empty string unchanged', () => {
    expect(toFieldValue('test')).toBe('test');
  });

  it('converts a positive integer to string', () => {
    expect(toFieldValue(42)).toBe('42');
  });

  it('converts zero to string', () => {
    expect(toFieldValue(0)).toBe('0');
  });

  it('converts a negative float to string', () => {
    expect(toFieldValue(-3.14)).toBe('-3.14');
  });

  it('converts true to string', () => {
    expect(toFieldValue(true)).toBe('true');
  });

  it('converts false to string', () => {
    expect(toFieldValue(false)).toBe('false');
  });

  it('JSON-stringifies a plain object', () => {
    expect(toFieldValue({ a: 1 })).toBe('{"a":1}');
  });

  it('JSON-stringifies an array', () => {
    expect(toFieldValue([1, 2, 3])).toBe('[1,2,3]');
  });
});

// ---------------------------------------------------------------------------
// applyToRadioNodeList
// ---------------------------------------------------------------------------

describe('applyToRadioNodeList', () => {
  it('checks the radio whose value matches and unchecks the others', () => {
    const form = buildForm(`
      <input type="radio" name="plan" value="free" />
      <input type="radio" name="plan" value="pro" />
      <input type="radio" name="plan" value="enterprise" />
    `);
    const list = getRadioList(form, 'plan');

    applyToRadioNodeList(list, 'pro');

    const [free, pro, enterprise] = Array.from(list);
    expect(free.checked).toBe(false);
    expect(pro.checked).toBe(true);
    expect(enterprise.checked).toBe(false);
  });

  it('sets defaultChecked on the matching radio so form.reset() restores it', () => {
    const form = buildForm(`
      <input type="radio" name="size" value="sm" />
      <input type="radio" name="size" value="lg" />
    `);
    const list = getRadioList(form, 'size');

    applyToRadioNodeList(list, 'lg');

    const [sm, lg] = Array.from(list);
    expect(sm.defaultChecked).toBe(false);
    expect(lg.defaultChecked).toBe(true);
  });

  it('unchecks all radios when no value matches', () => {
    const form = buildForm(`
      <input type="radio" name="color" value="red" checked />
      <input type="radio" name="color" value="blue" />
    `);
    const list = getRadioList(form, 'color');

    applyToRadioNodeList(list, 'green');

    for (const node of list) {
      expect((node).checked).toBe(false);
    }
  });

  it('checks all checkboxes in the list when value is truthy', () => {
    const form = buildForm(`
      <input type="checkbox" name="agree" value="a" />
      <input type="checkbox" name="agree" value="b" />
    `);
    const list = getRadioList(form, 'agree');

    applyToRadioNodeList(list, true);

    for (const node of list) {
      expect((node).checked).toBe(true);
      expect((node).defaultChecked).toBe(true);
    }
  });

  it('unchecks all checkboxes in the list when value is falsy', () => {
    const form = buildForm(`
      <input type="checkbox" name="agree" value="a" checked />
      <input type="checkbox" name="agree" value="b" checked />
    `);
    const list = getRadioList(form, 'agree');

    applyToRadioNodeList(list, false);

    for (const node of list) {
      expect((node).checked).toBe(false);
      expect((node).defaultChecked).toBe(false);
    }
  });

  it('does not throw when the list contains only valid radio inputs', () => {
    const form = buildForm(`
      <input type="radio" name="x" value="a" />
      <input type="radio" name="x" value="b" />
    `);
    const list = getRadioList(form, 'x');

    expect(() => applyToRadioNodeList(list, 'a')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// applyToElement
// ---------------------------------------------------------------------------

describe('applyToElement', () => {
  describe('text input', () => {
    it('sets value to the given string', () => {
      const input = document.createElement('input');
      input.type = 'text';

      applyToElement(input, 'test');

      expect(input.value).toBe('test');
    });

    it('sets defaultValue so form.reset() restores it', () => {
      const input = document.createElement('input');
      input.type = 'text';

      applyToElement(input, 'test');

      expect(input.defaultValue).toBe('test');
    });

    it('coerces a number to its string representation', () => {
      const input = document.createElement('input');
      input.type = 'number';

      applyToElement(input, 42);

      expect(input.value).toBe('42');
      expect(input.defaultValue).toBe('42');
    });

    it('sets value to empty string for null', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'previous';

      applyToElement(input, null);

      expect(input.value).toBe('');
      expect(input.defaultValue).toBe('');
    });
  });

  describe('textarea', () => {
    it('sets value and defaultValue', () => {
      const textarea = document.createElement('textarea');

      applyToElement(textarea, 'hello\nworld');

      expect(textarea.value).toBe('hello\nworld');
      expect(textarea.defaultValue).toBe('hello\nworld');
    });

    it('sets value to empty string for null', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'previous';

      applyToElement(textarea, null);

      expect(textarea.value).toBe('');
      expect(textarea.defaultValue).toBe('');
    });
  });

  describe('checkbox input', () => {
    it('checks the checkbox for a truthy value', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';

      applyToElement(input, true);

      expect(input.checked).toBe(true);
      expect(input.defaultChecked).toBe(true);
    });

    it('unchecks the checkbox for a falsy value', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;

      applyToElement(input, false);

      expect(input.checked).toBe(false);
      expect(input.defaultChecked).toBe(false);
    });

    it('checks the checkbox for a non-empty string (truthy)', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';

      applyToElement(input, 'yes');

      expect(input.checked).toBe(true);
    });
  });

  describe('radio input', () => {
    it('checks the radio for a truthy value', () => {
      const input = document.createElement('input');
      input.type = 'radio';

      applyToElement(input, true);

      expect(input.checked).toBe(true);
      expect(input.defaultChecked).toBe(true);
    });

    it('unchecks the radio for a falsy value', () => {
      const input = document.createElement('input');
      input.type = 'radio';
      input.checked = true;

      applyToElement(input, false);

      expect(input.checked).toBe(false);
      expect(input.defaultChecked).toBe(false);
    });
  });

  describe('select element', () => {
    it('selects the option matching the value', () => {
      const form = buildForm(`
        <select name="fruit">
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
          <option value="cherry">Cherry</option>
        </select>
      `);
      const select = getSelect(form, 'fruit');

      applyToElement(select, 'banana');

      expect(select.value).toBe('banana');
    });

    it('sets defaultSelected on the matching option', () => {
      const form = buildForm(`
        <select name="fruit">
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
        </select>
      `);
      const select = getSelect(form, 'fruit');

      applyToElement(select, 'banana');

      expect(select.options[0].defaultSelected).toBe(false);
      expect(select.options[1].defaultSelected).toBe(true);
    });

    it('coerces a number value to string when selecting', () => {
      const form = buildForm(`
        <select name="count">
          <option value="1">One</option>
          <option value="2">Two</option>
        </select>
      `);
      const select = getSelect(form, 'count');

      applyToElement(select, 2);

      expect(select.value).toBe('2');
    });
  });
});

// ---------------------------------------------------------------------------
// populateForm
// ---------------------------------------------------------------------------

describe('populateForm', () => {
  it('populates a text input and a number input from values', () => {
    const form = buildForm(`
      <input name="username" />
      <input name="price" type="number" />
    `);

    populateForm(form, { username: 'test', price: 42 });

    expect(getInput(form, 'username').value).toBe('test');
    expect(getInput(form, 'price').value).toBe('42');
  });

  it('populates a textarea field', () => {
    const form = buildForm(`<textarea name="bio"></textarea>`);

    populateForm(form, { bio: 'Hello world' });

    expect(getTextarea(form, 'bio').value).toBe('Hello world');
  });

  it('populates a select field', () => {
    const form = buildForm(`
      <select name="lang">
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
    `);

    populateForm(form, { lang: 'es' });

    expect(getSelect(form, 'lang').value).toBe('es');
  });

  it('populates radio inputs through the RadioNodeList path', () => {
    const form = buildForm(`
      <input type="radio" name="plan" value="free" />
      <input type="radio" name="plan" value="pro" />
    `);

    populateForm(form, { plan: 'pro' });

    const list = getRadioList(form, 'plan');
    const [free, pro] = Array.from(list);
    expect(free.checked).toBe(false);
    expect(pro.checked).toBe(true);
  });

  it('silently skips a field name that has no matching element', () => {
    const form = buildForm(`<input name="known" />`);

    expect(() => populateForm(form, { known: 'ok', unknown: 'ignored' })).not.toThrow();
    expect(getInput(form, 'known').value).toBe('ok');
  });

  it('leaves all fields unchanged when values is an empty object', () => {
    const form = buildForm(`<input name="x" value="original" />`);

    populateForm(form, {});

    expect(getInput(form, 'x').value).toBe('original');
  });

  it('populates multiple different field types in a single call', () => {
    const form = buildForm(`
      <input name="name" />
      <input type="checkbox" name="active" />
      <select name="role">
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
    `);

    populateForm(form, { name: 'test', active: true, role: 'admin' });

    expect(getInput(form, 'name').value).toBe('test');
    expect(getInput(form, 'active').checked).toBe(true);
    expect(getSelect(form, 'role').value).toBe('admin');
  });
});

// ---------------------------------------------------------------------------
// AstroForm web component
// ---------------------------------------------------------------------------

describe('AstroForm', () => {
  describe('connectedCallback', () => {
    it('populates text inputs from data-initial-values when mounted', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"username":"test","price":42}'>
          <input name="username" />
          <input name="price" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('test');
      expect(getInput(form, 'price').value).toBe('42');
    });

    it('populates a select from data-initial-values when mounted', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"lang":"es"}'>
          <select name="lang">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getSelect(form, 'lang').value).toBe('es');
    });

    it('does nothing when data-initial-values is absent', () => {
      const el = mountCustomElement(`
        <form>
          <input name="username" value="default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('default');
    });

    it('does nothing when data-initial-values is an empty string', () => {
      const el = mountCustomElement(`
        <form data-initial-values="">
          <input name="username" value="default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('default');
    });

    it('does not throw when data-initial-values is invalid JSON', () => {
      expect(() =>
        mountCustomElement(`
          <form data-initial-values="not-valid-json">
            <input name="username" value="default" />
          </form>
        `),
      ).not.toThrow();
    });

    it('leaves fields unchanged when data-initial-values parses to a JSON string', () => {
      const el = mountCustomElement(`
        <form data-initial-values='"just-a-string"'>
          <input name="username" value="default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('default');
    });

    it('leaves fields unchanged when data-initial-values parses to a JSON array', () => {
      const el = mountCustomElement(`
        <form data-initial-values='["a","b"]'>
          <input name="username" value="default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('default');
    });

    it('leaves fields unchanged when data-initial-values parses to null', () => {
      const el = mountCustomElement(`
        <form data-initial-values='null'>
          <input name="username" value="default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      expect(getInput(form, 'username').value).toBe('default');
    });

    it('does not throw when there is no form element inside', () => {
      expect(() =>
        mountCustomElement(`<div>no form here</div>`),
      ).not.toThrow();
    });
  });

  describe('form.reset() restores initial values', () => {
    it('restores a text input to its initial value after reset', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"username":"test"}'>
          <input name="username" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      const input = getInput(form, 'username');
      input.value = 'changed by user';

      form.reset();

      expect(input.value).toBe('test');
    });

    it('restores a number field to its initial value after reset', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"price":42}'>
          <input name="price" type="number" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      const input = getInput(form, 'price');
      input.value = '999';

      form.reset();

      expect(input.value).toBe('42');
    });

    it('restores a checkbox to its initial checked state after reset', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"active":true}'>
          <input type="checkbox" name="active" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      const input = getInput(form, 'active');
      input.checked = false;

      form.reset();

      expect(input.checked).toBe(true);
    });

    // Note: happy-dom does not implement form.reset() for <select> via defaultSelected.
    // The defaultSelected property is verified in the applyToElement > select element suite.
    // Full select-reset behaviour is validated in browser integration tests.

    it('leaves fields without an initial value reset to their HTML default', () => {
      const el = mountCustomElement(`
        <form data-initial-values='{"username":"test"}'>
          <input name="username" />
          <input name="notes" value="html-default" />
        </form>
      `);

      const form = el.querySelector('form');
      if (!(form instanceof HTMLFormElement)) throw new Error('form not found');

      getInput(form, 'username').value = 'changed';
      getInput(form, 'notes').value = 'user typed';

      form.reset();

      expect(getInput(form, 'username').value).toBe('test');
      expect(getInput(form, 'notes').value).toBe('html-default');
    });
  });
});
