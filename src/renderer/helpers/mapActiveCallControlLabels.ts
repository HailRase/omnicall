import type { ActiveCallControlOperationError } from "@application/index.js";
import { mapTransferDisabledReason } from "./mapTransferDisabledReason.js";

/**
 * - Purpose: map active call control disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from active call controls projection.
 * - Outputs: localized label string.
 */
export function mapActiveCallControlDisabledReason(
  reason: string,
  fallback = "Action unavailable",
): string {
  const transferLabel = mapTransferDisabledReason(reason);
  if (transferLabel !== null) {
    return transferLabel;
  }

  switch (reason) {
    case "call_ending":
      return "Call ending";
    case "hold_requires_active":
      return "Hold requires active call";
    case "resume_requires_held":
      return "Resume requires held call";
    case "mute_requires_active_or_held":
      return "Mute requires active or held call";
    case "already_muted":
      return "Call already muted";
    case "not_muted":
      return "Call is not muted";
    case "hangup_not_allowed":
      return "Hang up is not allowed";
    default:
      return fallback;
  }
}

/**
 * - Purpose: map active call control operation error to user-visible banner text.
 * - Inputs: last operation error from active call controls projection.
 * - Outputs: error banner message string.
 */
export function mapActiveCallControlOperationError(
  error: ActiveCallControlOperationError,
): string {
  const label = mapActiveCallControlOperationLabel(error.operation);
  return `${label} failed: ${error.message}`;
}

function mapActiveCallControlOperationLabel(
  operation: ActiveCallControlOperationError["operation"],
): string {
  switch (operation) {
    case "hold":
      return "Hold";
    case "resume":
      return "Resume";
    case "mute":
      return "Mute";
    case "unmute":
      return "Unmute";
    case "hangup":
      return "Hang up";
  }
}
