/**
 * - Purpose: define canonical call finite states.
 * - Inputs: call lifecycle event transition intent.
 * - Outputs: explicit state union value.
 */
export type CallState =
  | "Idle"
  | "Ringing"
  | "Connecting"
  | "Active"
  | "Held"
  | "Transferring"
  | "Conference"
  | "Ending"
  | "Ended"
  | "Failed";

export const CALL_STATES: ReadonlyArray<CallState> = [
  "Idle",
  "Ringing",
  "Connecting",
  "Active",
  "Held",
  "Transferring",
  "Conference",
  "Ending",
  "Ended",
  "Failed",
];

export function initialCallState(): CallState {
  return "Idle";
}

export function isTerminalCallState(state: CallState): boolean {
  return state === "Ended" || state === "Failed";
}

