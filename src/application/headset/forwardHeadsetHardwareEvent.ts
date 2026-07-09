import type { HeadsetHardwareEvent } from "@domain/index.js";
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
}>;

function hasActiveConversation(snapshot: HeadsetCallSnapshot): boolean {
  return snapshot.establishedCount > 0 || snapshot.activeSessionId !== undefined;
}

/**
 * - Purpose: map normalized headset hardware events to telephony callbacks.
 * - Inputs: hardware event, call snapshot, incoming id, callbacks, guard context.
 * - Outputs: invokes application callbacks when policy allows.
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

    if (hasPendingOutgoingDial(snapshot)) {
      return;
    }

    const heldId = snapshot.heldSessionIds[0];
    if (heldId !== undefined && snapshot.activeSessionId === undefined) {
      context.queue.beginHoldSessionSync(heldId, "resume");
      callbacks.onToggleHold(heldId);
      context.hookGuard.suppressedUntil = Date.now() + HOOK_ON_SUPPRESS_MS;
    }
    return;
  }

  if (event.type === "hookOn") {
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

  if (event.type === "mutePressed") {
    const activeId = snapshot.activeSessionId;
    if (activeId === undefined || context.queue.isMuteSyncGuardActive()) {
      return;
    }

    const nextMuted = !snapshot.activeIsMuted;
    context.queue.beginMuteSessionSync(activeId, nextMuted);
    callbacks.onSetMute(activeId, nextMuted);
    return;
  }

  if (event.type === "holdPressed" && snapshot.activeSessionId !== undefined) {
    const sessionId = snapshot.activeSessionId;
    const intent = snapshot.activeIsOnHold ? "resume" : "hold";
    context.queue.beginHoldSessionSync(sessionId, intent);
    callbacks.onToggleHold(sessionId);
  }
}
