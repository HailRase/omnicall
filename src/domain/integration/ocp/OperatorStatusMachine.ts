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

/**
 * How a user-initiated ready/break selection should be handled for the current status.
 * - `direct` — send change_status_to_* immediately (idle / preparing).
 * - `reserve` — send update_post_call_status (busy + post-call processing).
 *
 * Post-call finish is a separate command (`FinishPostCallAppealUseCase`), not a change mode.
 */
export type OperatorStatusChangeMode = "direct" | "reserve";

export function resolveOperatorStatusChangeMode(
  status: OperatorStatusType,
): OperatorStatusChangeMode {
  if (isBusy(status)) {
    return "reserve";
  }
  return "direct";
}

export function isPostCallProcessing(status: OperatorStatusType): boolean {
  return status === OperatorStatus.POST_CALL_PROCESSING;
}

export type PostCallFinishTarget = Readonly<{
  targetStatus: "ready" | "break";
  reasonId: number;
  usedReservation: boolean;
}>;

/**
 * Resolve which Ready/Break target finish-appeal applies when leaving post-call processing.
 * No reservation → Available (Ready, canonical reason id = READY).
 */
export function resolvePostCallFinishTarget(
  reservedStatus: OperatorStatusType | null,
  reservedReasonId: number | null,
): PostCallFinishTarget {
  if (reservedStatus === OperatorStatus.BREAK) {
    return {
      targetStatus: "break",
      reasonId:
        reservedReasonId !== null && Number.isFinite(reservedReasonId)
          ? reservedReasonId
          : OperatorStatus.BREAK,
      usedReservation: true,
    };
  }
  if (reservedStatus === OperatorStatus.READY) {
    return {
      targetStatus: "ready",
      reasonId:
        reservedReasonId !== null && Number.isFinite(reservedReasonId)
          ? reservedReasonId
          : OperatorStatus.READY,
      usedReservation: true,
    };
  }
  return {
    targetStatus: "ready",
    reasonId: OperatorStatus.READY,
    usedReservation: false,
  };
}
