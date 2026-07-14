/**
 * - Purpose: browser localStorage cache for OCP break reasons (legacy key shape).
 * - Inputs: operator id and OperatorStatusReason arrays.
 * - Outputs: JSON persistence under `ocp-break-reasons-{operatorId}`.
 */

import type { OperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";
import { isOperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import {
  buildOcpBreakReasonsCacheKey,
  type OcpReasonsCachePort,
} from "@ports/integration/OcpReasonsCachePort.js";

type StorageLike = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}>;

export class LocalStorageOcpReasonsCache implements OcpReasonsCachePort {
  constructor(private readonly storage: StorageLike) {}

  load(operatorId: number): ReadonlyArray<OperatorStatusReason> | null {
    const raw = this.storage.getItem(buildOcpBreakReasonsCacheKey(operatorId));
    if (raw === null) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return parseReasons(parsed);
    } catch {
      return null;
    }
  }

  save(
    operatorId: number,
    reasons: ReadonlyArray<OperatorStatusReason>,
  ): void {
    this.storage.setItem(
      buildOcpBreakReasonsCacheKey(operatorId),
      JSON.stringify(reasons),
    );
  }
}

function parseReasons(value: unknown): ReadonlyArray<OperatorStatusReason> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const reasons: OperatorStatusReason[] = [];
  for (const item of value) {
    const parsed = parseReasonItem(item);
    if (parsed === null) {
      return null;
    }
    reasons.push(parsed);
  }
  return reasons;
}

function parseReasonItem(item: unknown): OperatorStatusReason | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  if (!("id" in item) || !("parentStatus" in item) || !("defaultDescription" in item)) {
    return null;
  }
  const id = item.id;
  const parentStatus = item.parentStatus;
  const defaultDescription = item.defaultDescription;
  if (
    typeof id !== "number" ||
    !isOperatorStatus(parentStatus) ||
    typeof defaultDescription !== "string"
  ) {
    return null;
  }
  return { id, parentStatus, defaultDescription };
}
