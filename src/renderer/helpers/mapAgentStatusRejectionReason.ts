import type { AgentStatusRejectionReason } from "@application/index.js";
import { translateCurrent } from "../i18n/index.js";

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
      return translateCurrent("status.rejection.invalidTransition");
    case "dnd_blocks_ready":
      return translateCurrent("status.rejection.dndBlocksReady");
    case "break_reason_required":
      return translateCurrent("status.rejection.breakReasonRequired");
    case "already_in_status":
      return translateCurrent("status.rejection.alreadyInStatus");
    case "gateway_failed":
      return translateCurrent("status.rejection.gatewayFailed");
    case "ocp_not_connected":
      return translateCurrent("status.rejection.ocpNotConnected");
    case "network_error":
      return translateCurrent("status.rejection.networkError");
    default:
      return translateCurrent("status.rejection.default");
  }
}
