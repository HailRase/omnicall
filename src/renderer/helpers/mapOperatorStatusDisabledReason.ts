import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map operator status projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from operator status controls projection.
 * - Outputs: localized label string or null when key is not operator-status-related.
 */
export function mapOperatorStatusDisabledReason(reason: string): string | null {
  switch (reason) {
    case "ocp_not_connected":
      return translateCurrent("status.disabled.ocpNotConnected");
    case "invalid_transition":
      return translateCurrent("status.disabled.invalidTransition");
    case "dnd_blocks_ready":
      return translateCurrent("status.disabled.dndBlocksReady");
    case "status_change_in_progress":
      return translateCurrent("status.disabled.changeInProgress");
    case "break_reason_required":
      return translateCurrent("status.disabled.breakReasonRequired");
    default:
      return null;
  }
}

export function mapOperatorStatusDisabledReasonWithFallback(
  reason: string,
  fallback = translateCurrent("common.actionUnavailable"),
): string {
  return mapOperatorStatusDisabledReason(reason) ?? fallback;
}
