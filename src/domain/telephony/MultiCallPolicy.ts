/**
 * - Purpose: pure multi-call policy rules for sessions, hold-all, and exclusive hold.
 * - Inputs: call snapshots, multi-call settings, session direction intent.
 * - Outputs: allow/deny decisions and lists of calls requiring hold.
 */
import type { Call } from "./Call.js";
import type { CallId } from "./CallId.js";

export type MultiCallSettings = Readonly<{
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure?: boolean;
}>;

export type SecondSessionDirection = "outgoing" | "incoming_answer";

export type SecondSessionBlockReason = "multi_sessions_disabled";

export function isEstablishedCall(call: Call): boolean {
  return call.state === "Active" || call.state === "Held";
}

export function countEstablishedCalls(calls: ReadonlyArray<Call>): number {
  return calls.filter(isEstablishedCall).length;
}

export function hasConnectingCall(calls: ReadonlyArray<Call>): boolean {
  return calls.some((call) => call.state === "Connecting");
}

export function getActiveUnheldCalls(
  calls: ReadonlyArray<Call>,
  excludeCallId?: CallId,
): ReadonlyArray<Call> {
  return calls.filter(
    (call) =>
      call.state === "Active" &&
      (excludeCallId === undefined || call.id !== excludeCallId),
  );
}

export function evaluateSecondSessionBlock(
  establishedCallCount: number,
  settings: MultiCallSettings,
): Readonly<{ blocked: false } | { blocked: true; reason: SecondSessionBlockReason }> {
  if (establishedCallCount === 0) {
    return { blocked: false };
  }
  if (!settings.multiSessionsEnabled) {
    return { blocked: true, reason: "multi_sessions_disabled" };
  }
  return { blocked: false };
}

export function getCallsToHoldBeforeOutgoing(
  calls: ReadonlyArray<Call>,
): ReadonlyArray<Call> {
  return calls.filter((call) => call.state === "Active");
}

export function shouldHoldAllBeforeOutgoing(calls: ReadonlyArray<Call>): boolean {
  return getCallsToHoldBeforeOutgoing(calls).length > 0;
}

export function getCallsToHoldForExclusiveResume(
  calls: ReadonlyArray<Call>,
  targetCallId: CallId,
): ReadonlyArray<Call> {
  return getActiveUnheldCalls(calls, targetCallId);
}

export type MultiCallDisabledReason =
  | "second_session_disabled"
  | "hold_all_in_progress"
  | "connecting_in_progress";

export function deriveSecondSessionDialpadDisabled(
  hasEstablishedCall: boolean,
  hasConnectingCall: boolean,
  holdAllInProgress: boolean,
  settings: MultiCallSettings,
): Readonly<{ disabled: boolean; reason: MultiCallDisabledReason | null }> {
  if (holdAllInProgress) {
    return { disabled: true, reason: "hold_all_in_progress" };
  }
  if (hasConnectingCall) {
    return { disabled: true, reason: "connecting_in_progress" };
  }
  if (hasEstablishedCall && !settings.multiSessionsEnabled) {
    return { disabled: true, reason: "second_session_disabled" };
  }
  return { disabled: false, reason: null };
}
