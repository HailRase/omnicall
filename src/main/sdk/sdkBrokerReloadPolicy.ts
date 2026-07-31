/**
 * ADR-0009: clear broker ready only on real document navigations that drop
 * the renderer composition. Ignore same-document / subframe noise (DevTools,
 * iframes, in-page history) that previously used `did-start-loading` and left
 * product commands stuck on `not_ready` without a remount to re-signal ready.
 */

export type SdkBrokerNavigationSignal = Readonly<{
  readonly isMainFrame: boolean;
  readonly isSameDocument: boolean;
}>;

/** True when main must reject pending product work and await a fresh ready claim. */
export function shouldClearBrokerReadyOnNavigation(
  signal: SdkBrokerNavigationSignal,
): boolean {
  return signal.isMainFrame && !signal.isSameDocument;
}
