/**
 * - Purpose: in-memory OcpReasonsCachePort for tests and mock bootstrap.
 * - Inputs: operator id + reason lists.
 * - Outputs: cached snapshots keyed like localStorage (`ocp-break-reasons-{id}`).
 */

import type { OperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";
import {
  buildOcpBreakReasonsCacheKey,
  type OcpReasonsCachePort,
} from "@ports/integration/OcpReasonsCachePort.js";

export class InMemoryOcpReasonsCache implements OcpReasonsCachePort {
  private readonly entries = new Map<string, ReadonlyArray<OperatorStatusReason>>();

  load(operatorId: number): ReadonlyArray<OperatorStatusReason> | null {
    return this.entries.get(buildOcpBreakReasonsCacheKey(operatorId)) ?? null;
  }

  save(
    operatorId: number,
    reasons: ReadonlyArray<OperatorStatusReason>,
  ): void {
    this.entries.set(buildOcpBreakReasonsCacheKey(operatorId), reasons);
  }
}
