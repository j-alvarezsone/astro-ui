/**
 * Applies or removes the loading UI state on a button element.
 *
 * @param button - Target element that carries button classes/attributes.
 * @param isLoading - Whether loading state should be active.
 * @returns Nothing.
 * @example
 * ```ts
 * applyButtonLoadingState(saveButton, true);
 * ```
 */
export function applyButtonLoadingState(button: HTMLElement, isLoading: boolean): void {
  button.toggleAttribute('data-loading', isLoading);
  if (isLoading) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }
  button.classList.toggle('button--disabled', isLoading);

  if (button.parentElement) {
    button.parentElement.style.cursor = isLoading ? 'not-allowed' : '';
  }
}
