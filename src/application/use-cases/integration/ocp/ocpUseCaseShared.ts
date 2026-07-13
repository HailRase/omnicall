import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { OCP_FEATURE_ID } from "@domain/integration/ocp/events/OperatorStatusChanged.js";

export const OCP_USE_CASE_FEATURE_ID = OCP_FEATURE_ID;
export const OCP_BOUNDED_CONTEXT = "Integration" as const;

export type OcpUserTargetStatus = "ready" | "break";

export function mapOcpUserTargetStatus(
  targetStatus: OcpUserTargetStatus,
): typeof OperatorStatus.READY | typeof OperatorStatus.BREAK {
  return targetStatus === "ready" ? OperatorStatus.READY : OperatorStatus.BREAK;
}
