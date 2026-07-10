import type { HeadsetHardwareEvent, HeadsetMuteInputMode } from "@domain/index.js";
import type { HeadsetCallSnapshot } from "./buildHeadsetCallSnapshot.js";
import { hasPendingOutgoingDial } from "./buildHeadsetCallSnapshot.js";
import { resolveHangupTargetId } from "./resolveHangupTargetId.js";
import type { HeadsetSyncQueue } from "./HeadsetSyncQueue.js";

export const HOOK_ON_SUPPRESS_MS = 600;
export const WAITING_CALL_ANSWER_GUARD_MS = 1500;

export type HeadsetHardwareCallbacks = Readonly<{
  onAnswer: (callId: string | undefined) => void;
  onReject: (callId: string) => void;
  onHangup: (callId: string) => void;
  onToggleHold: (callId: string) => void;
  onSetMute: (callId: string, muted: boolean) => void;
  isDnd?: () => boolean;
}>;

type ForwardContext = Readonly<{
  hookGuard: { suppressedUntil: number };
  acceptGuard: { suppressedUntil: number };
  queue: HeadsetSyncQueue;
  muteInputMode: HeadsetMuteInputMode;
}>;

function hasActiveConversation(snapshot: HeadsetCallSnapshot): boolean {
  return snapshot.establishedCount > 0 || snapshot.activeSessionId !== undefined;
}

function isFocusOnOutgoing(snapshot: HeadsetCallSnapshot): boolean {
  return (
    snapshot.focusSessionId !== undefined &&
    snapshot.outgoingInProgressIds.includes(snapshot.focusSessionId)
  );
}

/**
 * Mute from headset only during an established conversation (Active/Held).
 * Blocked while incoming waiting or outgoing dialing/ringing (pre-connect).
 */
export function canToggleMuteFromHeadset(snapshot: HeadsetCallSnapshot): boolean {
  const focusId = snapshot.focusSessionId;
  if (focusId === undefined) {
    return false;
  }
  if (snapshot.incomingWaitingCount > 0) {
    return false;
  }
  if (
    snapshot.focusReason === "outgoing" ||
    isFocusOnOutgoing(snapshot) ||
    hasPendingOutgoingDial(snapshot)
  ) {
    return false;
  }
  return snapshot.establishedSessionIds.includes(focusId);
}

function resumeFocusedHeld(
  snapshot: HeadsetCallSnapshot,
  callbacks: HeadsetHardwareCallbacks,
  context: ForwardContext,
): boolean {
  if (snapshot.focusSessionId === undefined || !snapshot.focusedIsOnHold) {
    return false;
  }
  if (context.queue.isHardwareHoldLocked()) {
    return false;
  }

  const sessionId = snapshot.focusSessionId;
  if (!context.queue.beginHoldSessionSync(sessionId, "resume")) {
    return false;
  }
  callbacks.onToggleHold(sessionId);
  context.hookGuard.suppressedUntil = Date.now() + HOOK_ON_SUPPRESS_MS;
  return true;
}

/**
 * - Purpose: map normalized headset hardware events to telephony callbacks.
 * - Inputs: hardware event, call snapshot, incoming id, callbacks, guard context.
 * - Outputs: invokes application callbacks when policy allows.
 *
 * Softphone focus policies:
 * - hookOff + held focus → resume
 * - hookOn → hangup focused established/outgoing (including Held)
 * - muteChanged pulse → toggle on muted:true only (ignore release bounce)
 * - muteChanged latch → absolute mute bit when it differs from app
 */
export function forwardHeadsetHardwareEvent(
  event: HeadsetHardwareEvent,
  snapshot: HeadsetCallSnapshot,
  incomingSessionId: string | undefined,
  callbacks: HeadsetHardwareCallbacks,
  context: ForwardContext,
): void {
  const hasIncoming = snapshot.incomingWaitingCount > 0;

  if (event.type === "hookOff") {
    if (hasIncoming) {
      if (callbacks.isDnd?.()) {
        return;
      }

      const isWaitingCallAnswer = hasActiveConversation(snapshot);
      callbacks.onAnswer(incomingSessionId);
      const guardMs = isWaitingCallAnswer
        ? WAITING_CALL_ANSWER_GUARD_MS
        : HOOK_ON_SUPPRESS_MS;
      context.hookGuard.suppressedUntil = Date.now() + guardMs;
      if (isWaitingCallAnswer) {
        context.acceptGuard.suppressedUntil =
          Date.now() + WAITING_CALL_ANSWER_GUARD_MS;
      }
      return;
    }

    if (isFocusOnOutgoing(snapshot) || hasPendingOutgoingDial(snapshot)) {
      return;
    }

    if (resumeFocusedHeld(snapshot, callbacks, context)) {
      return;
    }

    return;
  }

  if (event.type === "hookOn") {
    if (isFocusOnOutgoing(snapshot) && snapshot.focusSessionId !== undefined) {
      callbacks.onHangup(snapshot.focusSessionId);
      return;
    }

    if (hasPendingOutgoingDial(snapshot)) {
      const outgoingId = snapshot.outgoingInProgressIds[0];
      if (outgoingId !== undefined) {
        callbacks.onHangup(outgoingId);
      }
      return;
    }

    if (Date.now() < context.hookGuard.suppressedUntil) {
      return;
    }

    if (Date.now() < context.acceptGuard.suppressedUntil) {
      return;
    }

    if (hasIncoming && incomingSessionId !== undefined) {
      if (hasActiveConversation(snapshot)) {
        return;
      }

      callbacks.onReject(incomingSessionId);
      return;
    }

    const hangupTarget = resolveHangupTargetId(snapshot);
    if (hangupTarget !== undefined) {
      callbacks.onHangup(hangupTarget);
    }
    return;
  }

  if (event.type === "muteChanged") {
    if (!canToggleMuteFromHeadset(snapshot)) {
      return;
    }

    const focusId = snapshot.focusSessionId;
    if (focusId === undefined) {
      return;
    }

    if (
      context.queue.shouldIgnoreHardwareMuteEvent(
        event.muted,
        snapshot.focusedIsMuted,
        context.muteInputMode,
      )
    ) {
      return;
    }

    // Pulse (Jabra HSC016 0x07/0x03): each press toggles; release is ignored upstream.
    if (context.muteInputMode === "pulse") {
      if (event.muted !== true) {
        return;
      }
      const nextMuted = !snapshot.focusedIsMuted;
      if (!context.queue.beginMuteSessionSync(focusId, nextMuted)) {
        return;
      }
      callbacks.onSetMute(focusId, nextMuted);
      return;
    }

    // Latch (Poly BW3320): apply absolute mute bit when it differs from app.
    if (event.muted === snapshot.focusedIsMuted) {
      return;
    }
    if (!context.queue.beginMuteSessionSync(focusId, event.muted)) {
      return;
    }
    callbacks.onSetMute(focusId, event.muted);
    return;
  }

  if (event.type === "holdPressed" && snapshot.focusSessionId !== undefined) {
    if (
      snapshot.incomingWaitingCount > 0 ||
      isFocusOnOutgoing(snapshot) ||
      context.queue.isHardwareHoldLocked()
    ) {
      return;
    }
    const sessionId = snapshot.focusSessionId;
    const intent = snapshot.focusedIsOnHold ? "resume" : "hold";
    if (!context.queue.beginHoldSessionSync(sessionId, intent)) {
      return;
    }
    callbacks.onToggleHold(sessionId);
  }
}
