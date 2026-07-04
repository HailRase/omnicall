export const ICON_TOOLTIP_DELAY_MS = 300;

/**
 * - Purpose: resolve hover delay for icon tooltips from motion preferences.
 * - Inputs: optional matchMedia for tests.
 * - Outputs: zero delay when reduced motion is preferred, else 300ms.
 */
export function resolveIconTooltipDelayMs(
  matchMedia?: (query: string) => MediaQueryList,
): number {
  const queryMedia =
    matchMedia ??
    (typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia.bind(window)
      : undefined);

  if (queryMedia === undefined) {
    return ICON_TOOLTIP_DELAY_MS;
  }

  if (queryMedia("(prefers-reduced-motion: reduce)").matches) {
    return 0;
  }

  return ICON_TOOLTIP_DELAY_MS;
}
