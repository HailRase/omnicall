import type { Call } from "./Call.js";
import type { CallId } from "./CallId.js";
import {
  isTransferSessionBlockingSecondConsultation,
  type TransferSession,
} from "./CallRelationship.js";
import { isTerminalCallState } from "./CallState.js";
import { hasConnectingCall } from "./MultiCallPolicy.js";
import { MAX_AUTO_ANSWER_TIMEOUT_SEC } from "../settings/UserSettings.js";

export const MIN_AUTO_ANSWER_TIMEOUT_SEC = 0;

export type AutoAnswerSchedule = Readonly<{
  timeoutSec: number;
}>;

export type AutoAnswerBlockedReason =
  | "other_session_busy_policy"
  | "outgoing_connecting"
  | "transfer_in_progress";

export type IncomingAutoAnswerScheduleDecision =
  | Readonly<{ action: "schedule"; timeoutSec: number }>
  | Readonly<{ action: "blocked"; reason: AutoAnswerBlockedReason }>;

/**
 * - Purpose: resolve whether auto-answer is enabled and its delay.
 * - Inputs: configured timeout seconds or null when disabled.
 * - Outputs: schedule with timeout 0…MAX or null when off.
 */
export function resolveAutoAnswerSchedule(
  autoAnswerTimeoutSec: number | null,
): AutoAnswerSchedule | null {
  if (autoAnswerTimeoutSec === null) {
    return null;
  }
  if (
    !Number.isInteger(autoAnswerTimeoutSec) ||
    autoAnswerTimeoutSec < MIN_AUTO_ANSWER_TIMEOUT_SEC ||
    autoAnswerTimeoutSec > MAX_AUTO_ANSWER_TIMEOUT_SEC
  ) {
    return null;
  }
  return { timeoutSec: autoAnswerTimeoutSec };
}

/**
 * - Purpose: count non-terminal sessions except the target incoming call.
 * - Inputs: tracked calls and incoming call id being evaluated.
 * - Outputs: number of blocking peer sessions (any state except Ended/Failed).
 */
export function countOtherSessionsForAutoAnswer(
  calls: ReadonlyArray<Call>,
  targetIncomingCallId: CallId,
): number {
  return calls.filter(
    (call) => call.id !== targetIncomingCallId && !isTerminalCallState(call.state),
  ).length;
}

/**
 * - Purpose: decide if auto-answer timer should start while peer sessions exist.
 * - Inputs: peer session count and busy-session policy flag.
 * - Outputs: true when scheduling is allowed.
 */
export function shouldScheduleAutoAnswer(
  otherSessionCount: number,
  autoAnswerDuringActiveSessionEnabled: boolean,
): boolean {
  if (otherSessionCount <= 0) {
    return true;
  }
  return autoAnswerDuringActiveSessionEnabled;
}

/**
 * - Purpose: detect global auto-answer blocks unrelated to busy-session policy.
 * - Inputs: tracked calls, transfer session, transfer-mode flag.
 * - Outputs: block reason or null when auto-answer may proceed.
 */
export function evaluateAutoAnswerGlobalBlock(
  calls: ReadonlyArray<Call>,
  transferSession: TransferSession | null,
  transferModeActive: boolean,
): AutoAnswerBlockedReason | null {
  if (hasConnectingCall(calls)) {
    return "outgoing_connecting";
  }
  if (transferModeActive) {
    return "transfer_in_progress";
  }
  if (calls.some((call) => call.state === "Transferring")) {
    return "transfer_in_progress";
  }
  if (isTransferSessionBlockingSecondConsultation(transferSession)) {
    return "transfer_in_progress";
  }
  return null;
}

/**
 * - Purpose: decide whether to schedule auto-answer for one ringing incoming call.
 * - Inputs: tracked calls, transfer context, policy flags, timeout seconds.
 * - Outputs: schedule or structured block reason.
 */
export function evaluateIncomingAutoAnswerSchedule(input: Readonly<{
  calls: ReadonlyArray<Call>;
  targetIncomingCallId: CallId;
  autoAnswerDuringActiveSessionEnabled: boolean;
  transferSession: TransferSession | null;
  transferModeActive: boolean;
  timeoutSec: number;
}>): IncomingAutoAnswerScheduleDecision {
  const globalBlock = evaluateAutoAnswerGlobalBlock(
    input.calls,
    input.transferSession,
    input.transferModeActive,
  );
  if (globalBlock !== null) {
    return { action: "blocked", reason: globalBlock };
  }

  const otherSessionCount = countOtherSessionsForAutoAnswer(
    input.calls,
    input.targetIncomingCallId,
  );
  if (
    !shouldScheduleAutoAnswer(
      otherSessionCount,
      input.autoAnswerDuringActiveSessionEnabled,
    )
  ) {
    return { action: "blocked", reason: "other_session_busy_policy" };
  }

  return { action: "schedule", timeoutSec: input.timeoutSec };
}
