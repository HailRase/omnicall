import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map transfer projection disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from transfer or active-call transfer controls.
 * - Outputs: localized label string or null when key is not transfer-related.
 */
export function mapTransferDisabledReason(reason: string): string | null {
  switch (reason) {
    case "no_active_call":
      return translateCurrent("transfer.disabled.noActiveCall");
    case "transfer_not_allowed":
      return translateCurrent("transfer.disabled.notAllowed");
    case "invalid_target":
      return translateCurrent("transfer.disabled.invalidTarget");
    case "transfer_in_progress":
      return translateCurrent("transfer.disabled.inProgress");
    case "consultation_in_progress":
      return translateCurrent("transfer.disabled.consultationInProgress");
    case "second_session_disabled":
      return translateCurrent("transfer.disabled.secondSessionDisabled");
    case "consultation_not_active":
      return translateCurrent("transfer.disabled.consultationNotActive");
    case "relationship_invalid":
      return translateCurrent("transfer.disabled.relationshipInvalid");
    case "no_source_call":
      return translateCurrent("transfer.disabled.noSourceCall");
    case "transfer_mode_active":
      return translateCurrent("transfer.disabled.modeAlreadyActive");
    default:
      return null;
  }
}

export function mapTransferDisabledReasonWithFallback(
  reason: string,
  fallback = translateCurrent("common.actionUnavailable"),
): string {
  return mapTransferDisabledReason(reason) ?? fallback;
}
