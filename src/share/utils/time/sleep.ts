/**
 * Pauses execution for the provided duration.
 *
 * @param ms - Delay duration in milliseconds.
 * @returns A promise that resolves after the delay completes.
 *
 * @example
 * await sleep(2500);
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}