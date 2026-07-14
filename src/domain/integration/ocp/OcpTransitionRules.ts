/**
 * - Purpose: client-initiated OCP operator status transition rules.
 * - Inputs: current and target OperatorStatus values.
 * - Outputs: allowed target statuses per source status.
 */

import { OperatorStatus, type OperatorStatus as OperatorStatusType } from "./OperatorStatus.js";

/** User-selectable idle targets (ready/break reason change + logout). */
const USER_IDLE_TARGETS: ReadonlyArray<OperatorStatusType> = [
  OperatorStatus.READY,
  OperatorStatus.BREAK,
  OperatorStatus.LOGOUT,
];

export const OPERATOR_STATUS_TRANSITIONS: ReadonlyMap<
  OperatorStatusType,
  ReadonlyArray<OperatorStatusType>
> = new Map([
  [OperatorStatus.READY, USER_IDLE_TARGETS],
  [OperatorStatus.BREAK, USER_IDLE_TARGETS],
  [OperatorStatus.PREPARING_TO_WORK, USER_IDLE_TARGETS],
  [
    OperatorStatus.POST_CALL_PROCESSING,
    [OperatorStatus.READY, OperatorStatus.BREAK, OperatorStatus.LOGOUT],
  ],
  [OperatorStatus.RINGING, []],
  [OperatorStatus.RESERVED_TO_CALL, []],
  [OperatorStatus.TALKING, []],
  [OperatorStatus.HOLD, []],
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
