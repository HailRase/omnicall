import type { AgentStatus, PhoneStatus } from "@domain/index.js";
import type { OperatorStatusProjection } from "./operatorStatusProjection.js";
import type { OperatorStatusDisabledReason } from "./operatorStatusProjection.js";

export type DeriveOperatorStatusDisabledContext = Readonly<{
  breakReasonProvided?: boolean;
}>;

/**
 * - Purpose: derive disabled reason for operator status controls from projection.
 * - Inputs: operator status projection, target status, phone presence, optional break reason flag.
 * - Outputs: disabled reason key or null when action is allowed at projection level.
 */
export function deriveOperatorStatusDisabledReason(
  projection: OperatorStatusProjection,
  targetStatus: AgentStatus,
  phoneStatus: PhoneStatus,
  context: DeriveOperatorStatusDisabledContext = {},
): OperatorStatusDisabledReason | null {
  if (!projection.isOcpStatusAvailable) {
    return "ocp_not_connected";
  }

  if (projection.statusChangeInProgress) {
    return "status_change_in_progress";
  }

  if (targetStatus === "ready" && phoneStatus === "dnd") {
    return "dnd_blocks_ready";
  }

  if (
    targetStatus === "break" &&
    projection.allowedBreakReasonsCount > 0 &&
    context.breakReasonProvided === false
  ) {
    return "break_reason_required";
  }

  return null;
}
