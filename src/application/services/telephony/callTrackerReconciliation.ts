import type { CallId, TransferSessionPhase } from "@domain/index.js";
import { isTerminalCallState } from "@domain/index.js";
import { isErr } from "@shared/result/index.js";
import type { CallTracker } from "./CallTracker.js";

const CONSULTATION_DIALING_PHASE: TransferSessionPhase = "consultation_dialing";

/**
 * - Purpose: purge stale call and transfer-session refs from in-memory tracker.
 * - Inputs: call tracker snapshot before multi-call or transfer policy checks.
 * - Outputs: tracker with terminal and orphaned sessions removed.
 */
export function reconcileCallTracker(tracker: CallTracker): void {
  for (const call of tracker.getAllTrackedCalls()) {
    if (isTerminalCallState(call.state)) {
      tracker.untrackCall(call.id);
    }
  }

  const session = tracker.getTransferSession();
  if (session !== null) {
    if (!isLiveTrackedCall(tracker, session.sourceCallId)) {
      tracker.setTransferSession(null);
    } else if (
      session.consultationCallId !== null &&
      !isLiveTrackedCall(tracker, session.consultationCallId) &&
      session.phase !== CONSULTATION_DIALING_PHASE
    ) {
      tracker.setTransferSession(null);
    }
  }

  const transferModeSourceCallId = tracker.getTransferModeSourceCallId();
  if (
    transferModeSourceCallId !== null &&
    !isLiveTrackedCall(tracker, transferModeSourceCallId)
  ) {
    tracker.setTransferModeSourceCallId(null);
  }
}

function isLiveTrackedCall(tracker: CallTracker, callId: CallId): boolean {
  const tracked = tracker.getTrackedCall(callId);
  if (isErr(tracked)) {
    return false;
  }
  return !isTerminalCallState(tracked.value.state);
}
