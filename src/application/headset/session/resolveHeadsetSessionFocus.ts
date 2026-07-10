export type HeadsetFocusReason =
  | "incoming"
  | "selected"
  | "primary"
  | "active"
  | "outgoing"
  | "held"
  | "idle";

export type HeadsetSessionFocus = Readonly<{
  focusSessionId: string | undefined;
  focusedIsMuted: boolean;
  focusedIsOnHold: boolean;
  focusReason: HeadsetFocusReason;
}>;

export type HeadsetFocusSessionLookup = Readonly<{
  muted: boolean;
  isOnHold: boolean;
}>;

export type ResolveHeadsetSessionFocusInput = Readonly<{
  selectedCallId: string | undefined;
  primarySessionId: string | undefined;
  activeSessionId: string | undefined;
  heldSessionIds: ReadonlyArray<string>;
  outgoingInProgressIds: ReadonlyArray<string>;
  establishedSessionIds: ReadonlyArray<string>;
  incomingWaitingCount: number;
  firstIncomingCallId: string | undefined;
  sessionById: Readonly<Record<string, HeadsetFocusSessionLookup>>;
}>;

const IDLE_FOCUS: HeadsetSessionFocus = {
  focusSessionId: undefined,
  focusedIsMuted: false,
  focusedIsOnHold: false,
  focusReason: "idle",
};

function isAliveSessionId(
  callId: string,
  input: ResolveHeadsetSessionFocusInput,
): boolean {
  if (input.firstIncomingCallId === callId && input.incomingWaitingCount > 0) {
    return true;
  }
  if (input.establishedSessionIds.includes(callId)) {
    return true;
  }
  return input.outgoingInProgressIds.includes(callId);
}

function focusForSession(
  callId: string,
  reason: HeadsetFocusReason,
  input: ResolveHeadsetSessionFocusInput,
): HeadsetSessionFocus {
  if (input.firstIncomingCallId === callId && input.incomingWaitingCount > 0) {
    return {
      focusSessionId: callId,
      focusedIsMuted: false,
      focusedIsOnHold: false,
      focusReason: reason,
    };
  }

  const session = input.sessionById[callId];
  return {
    focusSessionId: callId,
    focusedIsMuted: session?.muted ?? false,
    focusedIsOnHold: session?.isOnHold ?? false,
    focusReason: reason,
  };
}

/**
 * - Purpose: resolve which call session owns headset LED and hardware controls.
 * - Inputs: operator selection, primary/active/held/outgoing ids, incoming waiting, mute/hold lookup.
 * - Outputs: focus session id, mute/hold flags, and focus reason.
 * - Priority: incoming → outgoing → selected → primary → active → held → idle.
 */
export function resolveHeadsetSessionFocus(
  input: ResolveHeadsetSessionFocusInput,
): HeadsetSessionFocus {
  if (input.incomingWaitingCount > 0 && input.firstIncomingCallId !== undefined) {
    return focusForSession(input.firstIncomingCallId, "incoming", input);
  }

  // Outgoing dial auto-captures headset focus over operator selection (Q3=C).
  const outgoingId = input.outgoingInProgressIds[0];
  if (outgoingId !== undefined) {
    return focusForSession(outgoingId, "outgoing", input);
  }

  if (
    input.selectedCallId !== undefined &&
    isAliveSessionId(input.selectedCallId, input)
  ) {
    return focusForSession(input.selectedCallId, "selected", input);
  }

  if (
    input.primarySessionId !== undefined &&
    isAliveSessionId(input.primarySessionId, input)
  ) {
    return focusForSession(input.primarySessionId, "primary", input);
  }

  if (input.activeSessionId !== undefined) {
    return focusForSession(input.activeSessionId, "active", input);
  }

  const heldId = input.heldSessionIds[0];
  if (heldId !== undefined) {
    return focusForSession(heldId, "held", input);
  }

  return IDLE_FOCUS;
}
