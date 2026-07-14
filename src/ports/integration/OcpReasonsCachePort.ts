/**
 * - Purpose: persist operator break/status reasons across reconnects.
 * - Inputs: operator id and reason snapshots.
 * - Outputs: cached reasons or null when missing.
 */

import type { OperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";

export function buildOcpBreakReasonsCacheKey(operatorId: number): string {
  return `ocp-break-reasons-${operatorId}`;
}

export interface OcpReasonsCachePort {
  load(operatorId: number): ReadonlyArray<OperatorStatusReason> | null;
  save(
    operatorId: number,
    reasons: ReadonlyArray<OperatorStatusReason>,
  ): void;
}
