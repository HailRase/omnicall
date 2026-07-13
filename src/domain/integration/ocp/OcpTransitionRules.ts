/**
 * - Purpose: client-initiated OCP operator status transition rules.
 * - Inputs: current and target OperatorStatus values.
 * - Outputs: allowed target statuses per source status.
 */

import { OperatorStatus, type OperatorStatus as OperatorStatusType } from "./OperatorStatus.js";

export const OPERATOR_STATUS_TRANSITIONS: ReadonlyMap<
  OperatorStatusType,
  ReadonlyArray<OperatorStatusType>
> = new Map([
  [OperatorStatus.READY, [OperatorStatus.BREAK, OperatorStatus.LOGOUT]],
  [OperatorStatus.BREAK, [OperatorStatus.READY, OperatorStatus.LOGOUT]],
  [
    OperatorStatus.POST_CALL_PROCESSING,
    [OperatorStatus.READY, OperatorStatus.BREAK, OperatorStatus.LOGOUT],
  ],
  [OperatorStatus.RINGING, []],
  [OperatorStatus.RESERVED_TO_CALL, []],
  [OperatorStatus.TALKING, []],
  [OperatorStatus.HOLD, []],
  [OperatorStatus.PREPARING_TO_WORK, []],
  [OperatorStatus.LOGOUT, []],
  [OperatorStatus.AUTH, []],
  [OperatorStatus.RECONNECTED, []],
  [OperatorStatus.DISCONNECTED, []],
  [OperatorStatus.NEW_USER, []],
  [OperatorStatus.PRE_CALL_PROCESSING, []],
  [OperatorStatus.CONNECTION, []],
]);

export function getAllowedOperatorTransitions(
  from: OperatorStatusType,
): ReadonlyArray<OperatorStatusType> {
  return OPERATOR_STATUS_TRANSITIONS.get(from) ?? [];
}
