import type { Contact } from "@domain/index.js";
import type { CallLineCardViewModel } from "./deriveCallLinesShell.js";
import { deriveIncomingCallIdentityShell } from "./deriveIncomingCallIdentityShell.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";

export type DeriveIncomingCallControlLineInput = Readonly<{
  projection: IncomingCallProjection;
  contacts: ReadonlyArray<Contact>;
}>;

/**
 * - Purpose: build call-controls line view-model for pre-answer incoming session.
 * - Inputs: incoming call projection snapshot and active-account contacts.
 * - Outputs: Ringing line card for ControlsBar with hangup-as-reject enabled.
 */
export function deriveIncomingCallControlLine(
  input: DeriveIncomingCallControlLineInput,
): CallLineCardViewModel | null {
  const { projection, contacts } = input;

  if (projection.callId === null) {
    return null;
  }

  const identity = deriveIncomingCallIdentityShell({ projection, contacts });
  const displayName =
    identity.displayName ??
    identity.callerNumber ??
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
