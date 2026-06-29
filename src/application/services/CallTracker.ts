import type { Call, CallId, TransferSession } from "@domain/index.js";
import { isEstablishedCall, isTerminalCallState } from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";

/**
 * - Purpose: in-memory call state tracking for CallEngine orchestration.
 * - Inputs: call entities and call identifiers.
 * - Outputs: tracked call lookup results and active incoming reference.
 */
export class CallTracker {
  private activeIncomingCall: Call | null = null;
  private readonly trackedCalls = new Map<CallId, Call>();
  private transferSession: TransferSession | null = null;
  private transferModeSourceCallId: CallId | null = null;

  trackCall(call: Call): void {
    if (isTerminalCallState(call.state)) {
      this.untrackCall(call.id);
      return;
    }
    this.trackedCalls.set(call.id, call);
  }

  untrackCall(callId: CallId): void {
    this.trackedCalls.delete(callId);
    this.clearIncomingCallById(callId);
    this.clearTransferRefsForCall(callId);
  }

  finalizeCall(callId: CallId): void {
    this.untrackCall(callId);
  }

  getTrackedCall(
    callId: CallId,
  ): Result<Call, ReturnType<typeof createPlatformError>> {
    const trackedCall = this.trackedCalls.get(callId);
    if (trackedCall === undefined) {
      return err(createPlatformError("not_found", "Call not found"));
    }
    return ok(trackedCall);
  }

  getActiveIncomingCall(): Call | null {
    return this.activeIncomingCall;
  }

  setActiveIncomingCall(call: Call | null): void {
    this.activeIncomingCall = call;
  }

  clearIncomingCallById(callId: CallId): void {
    if (this.activeIncomingCall !== null && this.activeIncomingCall.id === callId) {
      this.activeIncomingCall = null;
    }
  }

  resolveForEnded(callId: CallId): Call | null {
    const trackedCall = this.trackedCalls.get(callId) ?? this.activeIncomingCall;
    if (trackedCall === null || trackedCall.id !== callId) {
      return null;
    }
    return trackedCall;
  }

  getAllTrackedCalls(): ReadonlyArray<Call> {
    return [...this.trackedCalls.values()];
  }

  getEstablishedCalls(): ReadonlyArray<Call> {
    return this.getAllTrackedCalls().filter(isEstablishedCall);
  }

  getActiveUnheldCall(): Call | null {
    for (const call of this.trackedCalls.values()) {
      if (call.state === "Active") {
        return call;
      }
    }
    return null;
  }

  countEstablishedCalls(): number {
    return this.getEstablishedCalls().length;
  }

  getTransferSession(): TransferSession | null {
    return this.transferSession;
  }

  setTransferSession(session: TransferSession | null): void {
    this.transferSession = session;
  }

  getTransferModeSourceCallId(): CallId | null {
    return this.transferModeSourceCallId;
  }

  setTransferModeSourceCallId(callId: CallId | null): void {
    this.transferModeSourceCallId = callId;
  }

  private clearTransferRefsForCall(callId: CallId): void {
    if (this.transferModeSourceCallId === callId) {
      this.transferModeSourceCallId = null;
    }
    if (this.transferSession === null) {
      return;
    }
    if (
      this.transferSession.sourceCallId === callId ||
      this.transferSession.consultationCallId === callId
    ) {
      this.transferSession = null;
    }
  }
}
