import type { AgentStatus, PhoneStatus } from "@domain/index.js";
import { getAllowedAgentStatusTransitions } from "@domain/index.js";
import type { OperatorStatusProjection } from "./operatorStatusProjection.js";
import type { OperatorStatusDisabledReason } from "./operatorStatusProjection.js";
import {
  deriveOperatorStatusDisabledReason,
  type DeriveOperatorStatusDisabledContext,
} from "./deriveOperatorStatusDisabledReason.js";

/**
 * - Purpose: derive full disabled reason for operator status controls including transitions.
 * - Inputs: operator projection, target status, phone status, optional break-reason context.
 * - Outputs: disabled reason key or null when control is enabled.
 */
export function deriveOperatorControlDisabledReason(
  projection: OperatorStatusProjection,
  targetStatus: Extract<AgentStatus, "ready" | "break">,
  phoneStatus: PhoneStatus,
  context: DeriveOperatorStatusDisabledContext = {},
): OperatorStatusDisabledReason | null {
  const projectionReason = deriveOperatorStatusDisabledReason(
    projection,
    targetStatus,
    phoneStatus,
    context,
  );

  if (projectionReason !== null) {
    return projectionReason;
  }

  const currentStatus = projection.currentStatus;
  if (currentStatus === null) {
    return "invalid_transition";
  }

  const allowed = getAllowedAgentStatusTransitions(currentStatus);
  if (!allowed.includes(targetStatus)) {
    return "invalid_transition";
  }

  return null;
}

export function buildOperatorBreakReasonContext(
  targetStatus: Extract<AgentStatus, "ready" | "break">,
  breakReasonRequired: boolean,
  selectedBreakReason: string | null,
): DeriveOperatorStatusDisabledContext {
  if (targetStatus !== "break" || !breakReasonRequired) {
    return {};
  }

  return {
    breakReasonProvided:
      selectedBreakReason !== null && selectedBreakReason.length > 0,
  };
}
