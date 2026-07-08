import type { DialpadMode } from "./callProjection.js";

export type DeriveIncomingCallSessionCardVisibleInput = Readonly<{
  incomingCallId: string | null;
  transferPanelVisible: boolean;
  transferSuccessCelebrationVisible: boolean;
  dialpadMode: DialpadMode;
  dtmfPanelCallId: string | null;
  numberEntryOverlayOpen: boolean;
}>;

/**
 * - Purpose: decide whether inline IncomingCallSessionCard renders in call context zone.
 * - Inputs: incoming call id and call UI mode flags that replace context content.
 * - Outputs: true when the session card is mounted in CallContextShell.
 */
export function deriveIncomingCallSessionCardVisible(
  input: DeriveIncomingCallSessionCardVisibleInput,
): boolean {
  if (input.incomingCallId === null) {
    return false;
  }
  if (input.transferPanelVisible || input.transferSuccessCelebrationVisible) {
    return false;
  }
  if (input.dialpadMode === "dtmf" && input.dtmfPanelCallId !== null) {
    return false;
  }
  if (input.numberEntryOverlayOpen) {
    return false;
  }
  return true;
}
