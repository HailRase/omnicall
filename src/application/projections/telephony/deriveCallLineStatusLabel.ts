import type { CallState } from "@domain/index.js";

export type CallLineStatusInput = Readonly<{
  state: CallState | "Idle";
}>;

export type CallLineStatusLabelKey =
  | "call.line.status.connecting"
  | "call.line.status.ringing"
  | "call.line.status.active"
  | "call.line.status.held"
  | "call.line.status.transferring"
  | "call.line.status.ending"
  | "call.line.status.ended"
  | "call.line.status.failed"
  | "call.line.status.idle"
  | "call.line.status.unknown";

/**
 * - Purpose: derive human-readable call line status from projection state.
 * - Inputs: line state and optional remote-hold flag.
 * - Outputs: operator-facing status label string.
 */
export function deriveCallLineStatusLabel(
  input: CallLineStatusInput,
): CallLineStatusLabelKey {
  switch (input.state) {
    case "Connecting":
      return "call.line.status.connecting";
    case "Ringing":
      return "call.line.status.ringing";
    case "Active":
      return "call.line.status.active";
    case "Held":
      return "call.line.status.held";
    case "Transferring":
      return "call.line.status.transferring";
    case "Ending":
      return "call.line.status.ending";
    case "Ended":
      return "call.line.status.ended";
    case "Failed":
      return "call.line.status.failed";
    case "Idle":
      return "call.line.status.idle";
    default:
      return "call.line.status.unknown";
  }
}
