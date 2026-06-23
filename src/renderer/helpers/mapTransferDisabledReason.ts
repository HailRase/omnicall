/**
 * - Purpose: map transfer projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from transfer or active-call transfer controls.
 * - Outputs: localized label string or null when key is not transfer-related.
 */
export function mapTransferDisabledReason(reason: string): string | null {
  switch (reason) {
    case "no_active_call":
      return "No active call";
    case "transfer_not_allowed":
      return "Transfer not available";
    case "invalid_target":
      return "Invalid transfer target";
    case "transfer_in_progress":
      return "Transfer in progress";
    case "consultation_in_progress":
      return "Consultation in progress";
    case "second_session_disabled":
      return "Second session disabled";
    case "consultation_not_active":
      return "Consultation not ready";
    case "relationship_invalid":
      return "Transfer relationship invalid";
    case "no_source_call":
      return "No source call";
    case "transfer_mode_active":
      return "Transfer mode already active";
    default:
      return null;
  }
}

export function mapTransferDisabledReasonWithFallback(
  reason: string,
  fallback = "Action unavailable",
): string {
  return mapTransferDisabledReason(reason) ?? fallback;
}
