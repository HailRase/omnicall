/**
 * - Purpose: guest page contract for External Application screen-pop windows.
 * - Inputs: close-guard callbacks registered by the loaded card page.
 * - Outputs: typed API surface exposed as `window.omnicall`.
 */

export type ExternalApplicationCloseGuard = () => boolean | Promise<boolean>;

export type ExternalApplicationGuestApi = Readonly<{
  /**
   * Registers an async/sync close check. Return `true` to allow close, `false` to block.
   * Replaces any previously registered guard. Clear with `clearCloseGuard`.
   */
  setCloseGuard: (guard: ExternalApplicationCloseGuard) => void;
  /** Removes the registered close guard; subsequent closes behave as unrestricted. */
  clearCloseGuard: () => void;
}>;

/** Must match the literal key exposed by `src/preload/externalApplicationGuest.ts`. */
export const EXTERNAL_APPLICATION_GUEST_API_KEY = "omnicall" as const;
