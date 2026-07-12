/**
 * - Purpose: keep per-call video media state outside the Call entity.
 * - Inputs: call id and selected media mode.
 * - Outputs: immutable video media state snapshots.
 */
import {
  createInitialCallVideoMediaState,
  setCameraAvailable,
  setLocalVideoMuted,
  setLocalVideoSource,
  setRemoteVideoPresent,
  setSessionViewMode,
  type CallId,
  type CallMediaMode,
  type CallVideoMediaState,
  type LocalVideoSource,
  type SessionViewMode,
} from "@domain/index.js";

export class CallVideoMediaProjection {
  private readonly states = new Map<CallId, CallVideoMediaState>();

  selectMediaMode(callId: CallId, mediaMode: CallMediaMode): CallVideoMediaState {
    const state = createInitialCallVideoMediaState(mediaMode);
    this.states.set(callId, state);
    return state;
  }

  getByCallId(callId: CallId): CallVideoMediaState | null {
    return this.states.get(callId) ?? null;
  }

  setRemoteVideoPresent(callId: CallId, present: boolean): CallVideoMediaState | null {
    return this.update(callId, (current) => setRemoteVideoPresent(current, present));
  }

  setLocalVideoMutedState(
    callId: CallId,
    muted: boolean,
  ): CallVideoMediaState | null {
    return this.update(callId, (current) => setLocalVideoMuted(current, muted));
  }

  setLocalVideoSourceState(
    callId: CallId,
    source: LocalVideoSource,
  ): CallVideoMediaState | null {
    return this.update(callId, (current) => setLocalVideoSource(current, source));
  }

  setSessionViewModeState(
    callId: CallId,
    sessionView: SessionViewMode,
  ): CallVideoMediaState | null {
    return this.update(callId, (current) => setSessionViewMode(current, sessionView));
  }

  setCameraAvailableState(
    callId: CallId,
    available: boolean,
  ): CallVideoMediaState | null {
    return this.update(callId, (current) => setCameraAvailable(current, available));
  }

  remove(callId: CallId): void {
    this.states.delete(callId);
  }

  private update(
    callId: CallId,
    mutate: (current: CallVideoMediaState) => CallVideoMediaState,
  ): CallVideoMediaState | null {
    const current = this.states.get(callId);
    if (current === undefined) {
      return null;
    }
    const next = mutate(current);
    this.states.set(callId, next);
    return next;
  }
}
