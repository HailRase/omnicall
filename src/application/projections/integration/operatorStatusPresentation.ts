/**
 * - Purpose: presentational keys and color tokens for OCP operator status UI (no renderer→Domain).
 * - Inputs: OperatorStatus from projections.
 * - Outputs: i18n label keys, CSS color vars, tone buckets for the header selector.
 */

import {
  OperatorStatus,
  OPERATOR_STATUS_LABEL_KEY,
  type OcpOperatorStatusLabelKey,
  type OperatorStatus as OperatorStatusType,
} from "@domain/integration/ocp/OperatorStatus.js";
import {
  isBusy,
  resolveOperatorStatusChangeMode,
  type OperatorStatusChangeMode,
} from "@domain/integration/ocp/OperatorStatusMachine.js";

export { OperatorStatus, OPERATOR_STATUS_LABEL_KEY, resolveOperatorStatusChangeMode };
export type {
  OcpOperatorStatusLabelKey,
  OperatorStatusChangeMode,
  OperatorStatusType as OperatorStatusValue,
};

/** Matches `OcpWebSocketAdapter` default max reconnect attempts. */
export const OCP_MAX_RECONNECT_ATTEMPTS = 6;

export type OperatorStatusTone = "ready" | "break" | "busy" | "unknown";

export function resolveOperatorStatusTone(
  status: OperatorStatusType | null,
): OperatorStatusTone {
  if (status === null) {
    return "unknown";
  }
  if (status === OperatorStatus.READY) {
    return "ready";
  }
  if (status === OperatorStatus.BREAK) {
    return "break";
  }
  return "busy";
}

export function resolveOperatorStatusColorVar(
  status: OperatorStatusType | null,
): string {
  const tone = resolveOperatorStatusTone(status);
  if (tone === "ready") {
    return "var(--color-status-online)";
  }
  if (tone === "break") {
    return "var(--color-status-dnd)";
  }
  return "var(--color-status-offline)";
}

export function resolveOperatorStatusLabelKey(
  status: OperatorStatusType | null,
): OcpOperatorStatusLabelKey | "ocp.operatorStatus.unknown" {
  if (status === null) {
    return "ocp.operatorStatus.unknown";
  }
  return OPERATOR_STATUS_LABEL_KEY[status];
}

export function isOperatorStatusBusy(status: OperatorStatusType | null): boolean {
  if (status === null) {
    return false;
  }
  return isBusy(status);
}

/**
 * Busy statuses still allow Ready/Break selection (reserve or post-call choose).
 * Dropdown disable is reserved for non-auth / connection chrome only.
 */
export function isOperatorStatusSelectorDisabled(
  status: OperatorStatusType | null,
): boolean {
  void status;
  return false;
}

export function resolveOperatorStatusChangeModeFromProjection(
  status: OperatorStatusType | null,
): OperatorStatusChangeMode | null {
  if (status === null) {
    return null;
  }
  return resolveOperatorStatusChangeMode(status);
}
