import type { AgentStatusRejectionReason } from "@domain/index.js";

/**
 * - Purpose: map agent status rejection reason keys to user-visible banner copy.
 * - Inputs: lastRejectionReason from operator status projection.
 * - Outputs: banner message string or null when no rejection to show.
 */
export function mapAgentStatusRejectionReason(
  reason: AgentStatusRejectionReason | null,
): string | null {
  if (reason === null) {
    return null;
  }

  switch (reason) {
    case "invalid_transition":
      return "This status change is not allowed.";
    case "dnd_blocks_ready":
      return "Cannot switch to Ready while Do Not Disturb is active.";
    case "break_reason_required":
      return "A valid break reason is required.";
    case "already_in_status":
      return "You are already in this status.";
    case "gateway_failed":
      return "Operator platform rejected the status change.";
    case "ocp_not_connected":
      return "Operator platform is unavailable.";
    case "network_error":
      return "Network error while changing status. Try again.";
    default:
      return "Status change failed.";
  }
}
