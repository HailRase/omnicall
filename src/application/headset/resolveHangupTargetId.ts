import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";

/**
 * - Purpose: resolve headset hook-on hangup target for the focused session.
 * - Inputs: normalized headset call snapshot with focus fields.
 * - Outputs: focused established/outgoing id to terminate, or undefined when idle.
 */
export function resolveHangupTargetId(
  snapshot: HeadsetCallSnapshot,
): string | undefined {
  const focusId = snapshot.focusSessionId;
  if (focusId !== undefined) {
    if (snapshot.outgoingInProgressIds.includes(focusId)) {
      return focusId;
    }
    if (snapshot.establishedSessionIds.includes(focusId)) {
      return focusId;
    }
  }

  if (snapshot.activeSessionId !== undefined) {
    return snapshot.activeSessionId;
  }

  const outgoingId = snapshot.outgoingInProgressIds[0];
  if (outgoingId !== undefined) {
    return outgoingId;
  }

  return undefined;
}
