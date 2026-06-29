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
 * - Purpose: mark transfer leg as ended in tracker state.
 * - Inputs: call snapshot in Transferring, Active, or Held state.
 * - Outputs: ended call snapshot or original on invalid transition.
 */
export function markCallLegEndedAfterTransfer(call: Call): Call {
  const fromTransferring = applyCallTransition(call, "transfer_completed");
  if (fromTransferring.transition.ok) {
    return fromTransferring.call;
  }

  const ended = applyCallTransition(call, "ended");
  return ended.transition.ok ? ended.call : call;
}

/**
 * - Purpose: mark attended-transfer source leg as ended in tracker state.
 * - Inputs: call snapshot in Transferring state.
 * - Outputs: ended call snapshot or original on invalid transition.
 */
export function markCallTransferCompleted(call: Call): Call {
  return markCallLegEndedAfterTransfer(call);
}
