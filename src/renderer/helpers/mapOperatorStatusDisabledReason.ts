/**
 * - Purpose: map operator status projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from operator status controls projection.
 * - Outputs: localized label string or null when key is not operator-status-related.
 */
export function mapOperatorStatusDisabledReason(reason: string): string | null {
  switch (reason) {
    case "ocp_not_connected":
      return "Operator platform unavailable";
    case "invalid_transition":
      return "Status change not allowed";
    case "dnd_blocks_ready":
      return "Ready unavailable while DND";
    case "status_change_in_progress":
      return "Status change in progress";
    case "break_reason_required":
      return "Break reason required";
    default:
      return null;
  }
}

export function mapOperatorStatusDisabledReasonWithFallback(
  reason: string,
  fallback = "Action unavailable",
): string {
  return mapOperatorStatusDisabledReason(reason) ?? fallback;
}
