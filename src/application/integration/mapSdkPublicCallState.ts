/**
 * Map Domain CallState → public SDK call lifecycle (protocol vocabulary).
 * Idle / unknown states are omitted from public summaries.
 */

import type { CallState } from "@domain/index.js";

export type SdkPublicCallState =
  | "ringing"
  | "connecting"
  | "active"
  | "held"
  | "ending"
  | "ended"
  | "failed";

/**
 * Returns null when the call must not appear in public call lists.
 */
export function mapSdkPublicCallState(
  state: CallState | "Idle",
): SdkPublicCallState | null {
  switch (state) {
    case "Ringing":
      return "ringing";
    case "Connecting":
      return "connecting";
    case "Active":
    case "Transferring":
    case "Conference":
      return "active";
    case "Held":
      return "held";
    case "Ending":
      return "ending";
    case "Ended":
      return "ended";
    case "Failed":
      return "failed";
    case "Idle":
      return null;
    default:
      return null;
  }
}
