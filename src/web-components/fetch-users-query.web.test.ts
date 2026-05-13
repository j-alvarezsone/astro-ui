import './fetch-users-query.web';

function buildElement(): HTMLElement {
  const el = document.createElement('fetch-users-query');
  el.innerHTML = `
    <button type="button" class="button">
      <span class="button__label">Fetch users</span>
    </button>
  `;
  document.body.appendChild(el);

  return el;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('FetchUsersQueryElement', () => {
  it('toggles loading state on a single button while fetch is running', async () => {
    const state = { resolveFetch: null as ((value?: void) => void) | null };

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          await new Promise<Response>((resolve) => {
            state.resolveFetch = () => {
              resolve(new Response('{"items":[]}'));
            };
          }),
      ),
    );

    const el = buildElement();
    const button = el.querySelector<HTMLButtonElement>('.button');

    expect(button).not.toBeNull();
    if (!button) {
      return;
    }

    button.click();
    await Promise.resolve();

    expect(button.hasAttribute('data-loading')).toBe(true);
    expect(button.classList.contains('button--disabled')).toBe(true);

    await vi.waitFor(() => {
      expect(state.resolveFetch).not.toBeNull();
    });
    state.resolveFetch?.();

    await vi.waitFor(() => {
      expect(button.hasAttribute('data-loading')).toBe(false);
      expect(button.classList.contains('button--disabled')).toBe(false);
    });
  });
});
