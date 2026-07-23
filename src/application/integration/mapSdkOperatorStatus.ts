/**
 * Map OCP operator status → coarse public SDK status (ADR-0017 O-OCP-1).
 * Post-call processing is a first-class public status so CRM can enable finish-appeal.
 */

import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";

export type SdkPublicOperatorStatus =
  | "ready"
  | "break"
  | "offline"
  | "post_call_processing"
  | "unknown";

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
