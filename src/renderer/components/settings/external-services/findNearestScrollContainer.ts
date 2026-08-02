/**
 * - Purpose: find the nearest scrollable clip ancestor for in-pane overlays.
 * - Inputs: start element (usually the overlay trigger).
 * - Outputs: first ancestor with overflow auto/scroll, or null (skips overflow:hidden).
 */

function isScrollOverflow(value: string): boolean {
  return value === "auto" || value === "scroll" || value === "overlay";
}

function readsAsScrollContainer(element: HTMLElement): boolean {
  const computed = getComputedStyle(element);
  if (
    isScrollOverflow(computed.overflowY) ||
    isScrollOverflow(computed.overflowX) ||
    isScrollOverflow(computed.overflow)
  ) {
    return true;
  }
  // jsdom may keep shorthand only on `.style.overflow` without resolving axes.
  return (
    isScrollOverflow(element.style.overflowY) ||
    isScrollOverflow(element.style.overflowX) ||
    isScrollOverflow(element.style.overflow)
  );
}

export function findNearestScrollContainer(start: Element): HTMLElement | null {
  let current: Element | null = start.parentElement;
  while (current !== null && current !== document.documentElement) {
    if (current instanceof HTMLElement && readsAsScrollContainer(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}
