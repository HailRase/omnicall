import type { Call, CallState } from "@domain/index.js";
import { applyCallTransition } from "@domain/index.js";

/**
 * - Purpose: restore source call state after attended transfer gateway failure.
 * - Inputs: source call snapshot and state before transfer_requested.
 * - Outputs: call entity restored to Active or Held.
 */
export function restoreSourceAfterAttendedTransferFailure(
  sourceCall: Call,
  previousState: CallState,
): Call {
  const restored = applyCallTransition(sourceCall, "transfer_failed");
  if (!restored.transition.ok) {
    return sourceCall;
  }

  if (previousState === "Held") {
    const held = applyCallTransition(restored.call, "hold_requested");
    if (held.transition.ok) {
      return held.call;
    }
  }

  return restored.call;
}

/**
 * - Purpose: mark attended-transfer leg as ended in tracker state.
 * - Inputs: call snapshot.
 * - Outputs: ended call snapshot or original on invalid transition.
 */
export function markCallTransferCompleted(call: Call): Call {
  const completed = applyCallTransition(call, "transfer_completed");
  return completed.transition.ok ? completed.call : call;
}
