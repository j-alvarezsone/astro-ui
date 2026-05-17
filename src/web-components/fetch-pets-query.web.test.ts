import './fetch-pets-query.web';

function buildElement(): HTMLElement {
  const el = document.createElement('fetch-pets-query');
  el.innerHTML = `
    <div data-pets-loader hidden>Loading...</div>
    <p data-pets-error hidden></p>
    <ul data-pets-list hidden></ul>
  `;
  document.body.appendChild(el);

  return el;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('FetchPetsQueryElement', () => {
  it('auto-fetches pets and renders list items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"items":[{"id":"p-1","name":"Milo","type":"dog"}]}')),
    );

    const el = buildElement();
    const list = el.querySelector<HTMLUListElement>('[data-pets-list]');
    const loader = el.querySelector<HTMLElement>('[data-pets-loader]');

    expect(list).not.toBeNull();
    expect(loader).not.toBeNull();

    await vi.waitFor(() => {
      const items = list?.querySelectorAll('li') ?? [];
      expect(items.length).toBe(1);
      expect(items[0]?.textContent).toBe('Milo (dog)');
    });

    expect(loader?.hidden).toBe(true);
    expect(list?.hidden).toBe(false);
  });
});