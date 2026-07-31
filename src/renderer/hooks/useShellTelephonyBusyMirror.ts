/**
 * Mirror ringing/connecting/established call context to main for SDK window:hide deny.
 * Renderer observes projections only; policy enforcement stays in main (ADR-0013).
 */

import { useEffect } from "react";
import type { CallProjection, IncomingCallProjection } from "@application/index.js";
import type { MultiCallProjection } from "@application/projections/telephony/multiCallProjection.js";
import type { ShellTelephonyBusyPayload } from "@shared/ipc/ShellTelephonyBusyContract.js";

type UseShellTelephonyBusyMirrorInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
  callProjection: CallProjection;
  multiCallProjection: MultiCallProjection;
  setBusy?: (payload: ShellTelephonyBusyPayload) => Promise<unknown>;
}>;

function defaultSetBusy(payload: ShellTelephonyBusyPayload): Promise<unknown> {
  return window.softphone.setShellTelephonyBusy(payload);
}

export function deriveShellTelephonyBusy(input: {
  readonly incomingVisible: boolean;
  readonly callState: CallProjection["state"];
  readonly hasEstablishedCall: boolean;
  readonly hasConnectingCall: boolean;
}): boolean {
  if (input.incomingVisible) {
    return true;
  }
  if (input.hasEstablishedCall || input.hasConnectingCall) {
    return true;
  }
  return (
    input.callState === "Ringing" ||
    input.callState === "Connecting" ||
    input.callState === "Active" ||
    input.callState === "Held" ||
    input.callState === "Transferring" ||
    input.callState === "Conference"
  );
}

export function useShellTelephonyBusyMirror(
  input: UseShellTelephonyBusyMirrorInput,
): void {
  const setBusy = input.setBusy ?? defaultSetBusy;
  const busy = deriveShellTelephonyBusy({
    incomingVisible: input.incomingCallProjection.visible,
    callState: input.callProjection.state,
    hasEstablishedCall: input.multiCallProjection.hasEstablishedCall,
    hasConnectingCall: input.multiCallProjection.hasConnectingCall,
  });

  useEffect(() => {
    void setBusy({ busy });
  }, [busy, setBusy]);
}
