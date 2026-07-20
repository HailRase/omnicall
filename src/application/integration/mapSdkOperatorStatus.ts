/**
 * Map OCP operator status → coarse public SDK status (ADR-0017 O-OCP-1).
 */

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";

export type SdkPublicOperatorStatus = "ready" | "break" | "offline" | "unknown";

export function mapSdkOperatorStatus(
  status: OperatorStatusType | null,
): SdkPublicOperatorStatus {
  if (status === null) {
    return "unknown";
  }
  if (status === OperatorStatus.READY) {
    return "ready";
  }
  if (status === OperatorStatus.BREAK) {
    return "break";
  }
  if (
    status === OperatorStatus.DISCONNECTED ||
    status === OperatorStatus.LOGOUT
  ) {
    return "offline";
  }
  return "unknown";
}
