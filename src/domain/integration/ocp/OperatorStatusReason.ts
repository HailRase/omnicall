/**
 * - Purpose: OCP operator status reason value object from operator_status_reasons.
 * - Inputs: reason id, parent status, default description from OCP payload.
 * - Outputs: immutable OperatorStatusReason for UI and command routing.
 */

import type { OperatorStatus } from "./OperatorStatus.js";

export type OperatorStatusReason = Readonly<{
  id: number;
  parentStatus: OperatorStatus;
  defaultDescription: string;
}>;

export function createOperatorStatusReason(input: {
  id: number;
  parentStatus: OperatorStatus;
  defaultDescription: string;
}): OperatorStatusReason {
  return {
    id: input.id,
    parentStatus: input.parentStatus,
    defaultDescription: input.defaultDescription,
  };
}
