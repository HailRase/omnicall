import type { IncomingCallProjection } from "./incomingCallProjection.js";

export type IncomingCallOverlayShellRouteName =
  | "dialpad"
  | "history"
  | "historyDetails"
  | "contacts"
  | "contactDetails"
  | "contactEdit"
  | "settings";

export type DeriveIncomingCallGlobalOverlayVisibleInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
  dismissedCallId: string | null;
  shellRouteName: IncomingCallOverlayShellRouteName;
  incomingSessionCardVisible: boolean;
  /** When true, force top-center banner above video fullscreen modal. */
  videoFullscreen?: boolean;
}>;

/**
 * - Purpose: decide whether global IncomingCallOverlay should render above the shell.
 * - Inputs: ringing projection, dismiss state, route, and inline session card visibility.
 * - Outputs: true when incoming UX must use the global banner instead of context card.
 */
export function deriveIncomingCallGlobalOverlayVisible(
  input: DeriveIncomingCallGlobalOverlayVisibleInput,
): boolean {
  const ringingCallId =
    input.incomingCallProjection.visible && input.incomingCallProjection.callId !== null
      ? input.incomingCallProjection.callId
      : null;

  if (ringingCallId === null || ringingCallId === input.dismissedCallId) {
    return false;
  }

  if (input.videoFullscreen === true) {
    return true;
  }

  if (input.shellRouteName === "dialpad") {
    return !input.incomingSessionCardVisible;
  }

  return true;
}
