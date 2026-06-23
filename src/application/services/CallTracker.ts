import type { Call, CallId } from "@domain/index.js";
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

  trackCall(call: Call): void {
    this.trackedCalls.set(call.id, call);
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
}
