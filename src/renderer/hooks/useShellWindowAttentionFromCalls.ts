/**
 * Hook: raise shell window on telephony edges (incoming ring / outgoing connect).
 * Renderer observes projections only; native raise runs in main via IPC (ADR-0013).
 */

import { useEffect, useRef } from "react";
import type { CallProjection, IncomingCallProjection } from "@application/index.js";
import type { ShellWindowRaisePayload } from "@shared/ipc/ShellWindowRaiseContract.js";

type UseShellWindowAttentionFromCallsInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
  callProjection: CallProjection;
  raiseWindow?: (payload: ShellWindowRaisePayload) => Promise<unknown>;
}>;

function defaultRaiseWindow(payload: ShellWindowRaisePayload): Promise<unknown> {
  return window.softphone.raiseShellWindow(payload);
}

/**
 * Edge-trigger raise once per callId for incoming ringing and outgoing Connecting.
 */
export function useShellWindowAttentionFromCalls(
  input: UseShellWindowAttentionFromCallsInput,
): void {
  const raiseWindow = input.raiseWindow ?? defaultRaiseWindow;
  const raisedIncomingRef = useRef<string | null>(null);
  const raisedOutgoingRef = useRef<string | null>(null);

  const incomingCallId =
    input.incomingCallProjection.visible &&
    input.incomingCallProjection.callId !== null
      ? input.incomingCallProjection.callId
      : null;

  const outgoingCallId =
    input.callProjection.state === "Connecting" &&
    input.callProjection.activeCallId !== null
      ? input.callProjection.activeCallId
      : null;

  useEffect(() => {
    if (incomingCallId === null) {
      raisedIncomingRef.current = null;
      return;
    }
    if (raisedIncomingRef.current === incomingCallId) {
      return;
    }
    raisedIncomingRef.current = incomingCallId;
    void raiseWindow({
      reason: "incoming_call",
      dedupeKey: incomingCallId,
    });
  }, [incomingCallId, raiseWindow]);

  useEffect(() => {
    if (outgoingCallId === null) {
      raisedOutgoingRef.current = null;
      return;
    }
    if (raisedOutgoingRef.current === outgoingCallId) {
      return;
    }
    raisedOutgoingRef.current = outgoingCallId;
    void raiseWindow({
      reason: "outgoing_call",
      dedupeKey: outgoingCallId,
    });
  }, [outgoingCallId, raiseWindow]);
}
