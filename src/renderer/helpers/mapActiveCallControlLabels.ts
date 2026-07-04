import type { ActiveCallControlOperationError } from "@application/index.js";
import { translateCurrent } from "../i18n/index.js";
import { mapTransferDisabledReason } from "./mapTransferDisabledReason.js";

/**
 * - Purpose: map active call control disabled reason keys to user-visible labels.
 * - Inputs: disabled reason key from active call controls projection.
 * - Outputs: localized label string.
 */
export function mapActiveCallControlDisabledReason(
  reason: string,
  fallback = translateCurrent("common.actionUnavailable"),
): string {
  const transferLabel = mapTransferDisabledReason(reason);
  if (transferLabel !== null) {
    return transferLabel;
  }

  switch (reason) {
    case "call_ending":
      return translateCurrent("activeCall.disabled.callEnding");
    case "hold_requires_active":
      return translateCurrent("activeCall.disabled.holdRequiresActive");
    case "resume_requires_held":
      return translateCurrent("activeCall.disabled.resumeRequiresHeld");
    case "mute_requires_active_or_held":
      return translateCurrent("activeCall.disabled.muteRequiresActiveOrHeld");
    case "already_muted":
      return translateCurrent("activeCall.disabled.alreadyMuted");
    case "not_muted":
      return translateCurrent("activeCall.disabled.notMuted");
    case "hangup_not_allowed":
      return translateCurrent("activeCall.disabled.hangupNotAllowed");
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
  return translateCurrent("activeCall.operationError", {
    operation: label,
    message: error.message,
  });
}

function mapActiveCallControlOperationLabel(
  operation: ActiveCallControlOperationError["operation"],
): string {
  switch (operation) {
    case "hold":
      return translateCurrent("activeCall.operation.hold");
    case "resume":
      return translateCurrent("activeCall.operation.resume");
    case "mute":
      return translateCurrent("activeCall.operation.mute");
    case "unmute":
      return translateCurrent("activeCall.operation.unmute");
    case "hangup":
      return translateCurrent("activeCall.operation.hangup");
  }
}
