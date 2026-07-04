import type { CallLineCardViewModel } from "./deriveCallLinesShell.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";

/**
 * - Purpose: build call-controls line view-model for pre-answer incoming session.
 * - Inputs: incoming call projection snapshot.
 * - Outputs: Ringing line card for ControlsBar with hangup-as-reject enabled.
 */
export function deriveIncomingCallControlLine(
  projection: IncomingCallProjection,
): CallLineCardViewModel | null {
  if (projection.callId === null) {
    return null;
  }

  const displayName =
    projection.callerNumber ??
    projection.displayName ??
    "call.line.display.unknown";

  return {
    callId: projection.callId,
    role: "primary",
    state: "Ringing",
    muted: false,
    isActiveUnheld: false,
    displayName,
    statusLabel: "call.line.status.ringing",
    durationStartedAt: null,
    queueLabelState: "hidden",
    queueName: null,
    primaryAction: "answer",
    showIconRow: false,
    showLocalHoldBadge: false,
    showRemoteHoldBadge: false,
    resumeDisabledReason: null,
    hangupDisabledReason:
      projection.uiState === "rejecting" || projection.uiState === "answering"
        ? ("call_ending" as const)
        : null,
    holdDisabledReason: "hold_requires_active",
    muteDisabledReason: "mute_requires_active_or_held",
    unmuteDisabledReason: null,
    transferDisabledReason: "transfer_requires_active",
  };
}
