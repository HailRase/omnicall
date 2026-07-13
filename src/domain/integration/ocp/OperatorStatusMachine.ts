/**
 * - Purpose: pure OCP operator status transition validation and predicates.
 * - Inputs: current and target OperatorStatus values.
 * - Outputs: transition result or busy/working/user-initiate predicates.
 */

import {
  OperatorStatus,
  USER_STATUSES_BUSY,
  USER_STATUSES_WORKING,
  type OperatorStatus as OperatorStatusType,
} from "./OperatorStatus.js";
import { getAllowedOperatorTransitions } from "./OcpTransitionRules.js";

export type OperatorTransitionError = "transition_not_allowed";

export type OperatorTransitionResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: OperatorTransitionError }>;

const USER_INITIATABLE_STATUSES: ReadonlySet<OperatorStatusType> = new Set([
  OperatorStatus.READY,
  OperatorStatus.BREAK,
  OperatorStatus.LOGOUT,
]);

export function validateTransition(
  from: OperatorStatusType,
  to: OperatorStatusType,
): OperatorTransitionResult {
  const allowedTargets = getAllowedOperatorTransitions(from);
  if (!allowedTargets.includes(to)) {
    return { ok: false, error: "transition_not_allowed" };
  }
  return { ok: true };
}

export function isBusy(status: OperatorStatusType): boolean {
  return USER_STATUSES_BUSY.has(status);
}

export function isWorking(status: OperatorStatusType): boolean {
  return USER_STATUSES_WORKING.has(status);
}

export function canUserInitiate(status: OperatorStatusType): boolean {
  return USER_INITIATABLE_STATUSES.has(status);
}
