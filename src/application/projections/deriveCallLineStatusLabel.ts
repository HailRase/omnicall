import type { CallState } from "@domain/index.js";

export type CallLineStatusInput = Readonly<{
  state: CallState | "Idle";
  isRemoteHold?: boolean;
}>;

/**
 * - Purpose: derive human-readable call line status from projection state.
 * - Inputs: line state and optional remote-hold flag.
 * - Outputs: operator-facing status label string.
 */
export function deriveCallLineStatusLabel(input: CallLineStatusInput): string {
  if (input.isRemoteHold === true) {
    return "On remote hold";
  }

  switch (input.state) {
    case "Connecting":
      return "Connecting";
    case "Ringing":
      return "Ringing";
    case "Active":
      return "On line";
    case "Held":
      return "On hold";
    case "Transferring":
      return "Transferring";
    case "Ending":
      return "Ending";
    case "Ended":
      return "Ended";
    case "Failed":
      return "Failed";
    case "Idle":
      return "Idle";
    default:
      return "Unknown";
  }
}
