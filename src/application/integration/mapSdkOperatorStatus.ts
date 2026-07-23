/**
 * Map OCP operator status → coarse public SDK status (ADR-0017 O-OCP-1).
 * Post-call processing is a first-class public status so CRM can enable finish-appeal.
 * Post-call reservation projects as optional reservedTarget (ready|break only).
 */

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";

export type SdkPublicOperatorStatus =
  | "ready"
  | "break"
  | "offline"
  | "post_call_processing"
  | "unknown";

/** Public post-call booking target (never mirrors OCP numeric RESERVED_TO_CALL). */
export type SdkPublicReservedTarget = "ready" | "break";

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
  if (status === OperatorStatus.POST_CALL_PROCESSING) {
    return "post_call_processing";
  }
  if (
    status === OperatorStatus.DISCONNECTED ||
    status === OperatorStatus.LOGOUT
  ) {
    return "offline";
  }
  return "unknown";
}

/**
 * Map local reserved OCP status → public reservedTarget.
 * Only Ready/Break are user-bookable; anything else is omitted.
 */
export function mapSdkReservedOperatorTarget(
  reservedStatus: OperatorStatusType | null,
): SdkPublicReservedTarget | null {
  if (reservedStatus === OperatorStatus.READY) {
    return "ready";
  }
  if (reservedStatus === OperatorStatus.BREAK) {
    return "break";
  }
  return null;
}
