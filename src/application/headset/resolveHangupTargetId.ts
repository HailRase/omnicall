import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";

/**
 * - Purpose: resolve headset hook-on hangup target without dropping held-only calls.
 * - Inputs: normalized headset call snapshot.
 * - Outputs: session id to terminate, or undefined when hangup must be ignored.
 */
export function resolveHangupTargetId(
  snapshot: HeadsetCallSnapshot,
): string | undefined {
  if (snapshot.activeSessionId !== undefined) {
    return snapshot.activeSessionId;
  }

  const outgoingId = snapshot.outgoingInProgressIds[0];
  if (outgoingId !== undefined) {
    return outgoingId;
  }

  if (
    snapshot.establishedCount > 0 &&
    snapshot.heldSessionIds.length >= snapshot.establishedCount
  ) {
    return undefined;
  }

  return undefined;
}
