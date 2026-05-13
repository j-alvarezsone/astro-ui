/**
 * Applies or removes the loading UI state on a button element.
 *
 * @param button - Target element that carries button classes/attributes.
 * @param isLoading - Whether loading state should be active.
 */
export function applyButtonLoadingState(button: HTMLElement, isLoading: boolean): void {
  button.toggleAttribute('data-loading', isLoading);
  button.toggleAttribute('aria-busy', isLoading);
  button.classList.toggle('button--disabled', isLoading);

  if (button.parentElement) {
    button.parentElement.style.cursor = isLoading ? 'not-allowed' : '';
  }
}
