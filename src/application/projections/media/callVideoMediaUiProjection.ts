/**
 * - Purpose: project per-call video media Domain events for renderer shells.
 * - Inputs: previous map and DomainEvent stream.
 * - Outputs: callId → CallVideoMediaState for video UI.
 */

import {
  createInitialCallVideoMediaState,
  setCameraAvailable,
  setLocalVideoMuted,
  setLocalVideoSource,
  setRemoteVideoPresent,
  setSessionViewMode,
  type CallId,
  type CallVideoMediaState,
  type DomainEvent,
} from "@domain/index.js";
import { createCallId } from "@domain/telephony/CallId.js";
import { isSessionResetEvent } from "../platform/sessionResetEvents.js";

export type CallVideoMediaUiProjection = Readonly<{
  byCallId: Readonly<Record<string, CallVideoMediaState>>;
}>;

export function initialCallVideoMediaUiProjection(): CallVideoMediaUiProjection {
  return { byCallId: {} };
}

export function reduceCallVideoMediaUiProjection(
  projection: CallVideoMediaUiProjection,
  event: DomainEvent,
): CallVideoMediaUiProjection {
  if (isSessionResetEvent(event)) {
    return initialCallVideoMediaUiProjection();
  }

  switch (event.type) {
    case "CallMediaModeSelected": {
      const callId = asCallId(event["callId"]);
      const mediaMode = event["mediaMode"];
      if (callId === null || (mediaMode !== "audio" && mediaMode !== "video")) {
        return projection;
      }
      return upsert(projection, callId, createInitialCallVideoMediaState(mediaMode));
    }
    case "LocalVideoMutedChanged": {
      const callId = asCallId(event["callId"]);
      if (callId === null || typeof event["muted"] !== "boolean") {
        return projection;
      }
      const current = projection.byCallId[callId] ?? createInitialCallVideoMediaState("video");
      return upsert(projection, callId, setLocalVideoMuted(current, event["muted"]));
    }
    case "LocalVideoSourceChanged": {
      const callId = asCallId(event["callId"]);
      const source = event["source"];
      if (
        callId === null ||
        (source !== "none" && source !== "camera" && source !== "screen")
      ) {
        return projection;
      }
      const current = projection.byCallId[callId] ?? createInitialCallVideoMediaState("video");
      return upsert(projection, callId, setLocalVideoSource(current, source));
    }
    case "RemoteVideoPresenceChanged": {
      const callId = asCallId(event["callId"]);
      if (callId === null || typeof event["present"] !== "boolean") {
        return projection;
      }
      const current = projection.byCallId[callId] ?? createInitialCallVideoMediaState("video");
      return upsert(projection, callId, setRemoteVideoPresent(current, event["present"]));
    }
    case "SessionViewModeChanged": {
      const callId = asCallId(event["callId"]);
      const sessionView = event["sessionView"];
      if (
        callId === null ||
        (sessionView !== "compact" &&
          sessionView !== "expanded" &&
          sessionView !== "fullscreen")
      ) {
        return projection;
      }
      const current = projection.byCallId[callId] ?? createInitialCallVideoMediaState("video");
      return upsert(projection, callId, setSessionViewMode(current, sessionView));
    }
    case "CameraAvailabilityChanged": {
      const callId = asCallId(event["callId"]);
      if (callId === null || typeof event["available"] !== "boolean") {
        return projection;
      }
      const current = projection.byCallId[callId] ?? createInitialCallVideoMediaState("video");
      return upsert(projection, callId, setCameraAvailable(current, event["available"]));
    }
    case "CallEnded":
    case "CallFailed":
    case "IncomingCallEndedBeforeAnswer": {
      const callId = asCallId(event["callId"]);
      if (callId === null) {
        return projection;
      }
      const nextByCallId = { ...projection.byCallId };
      delete nextByCallId[callId];
      return { byCallId: nextByCallId };
    }
    default:
      return projection;
  }
}

function upsert(
  projection: CallVideoMediaUiProjection,
  callId: CallId,
  state: CallVideoMediaState,
): CallVideoMediaUiProjection {
  return {
    byCallId: {
      ...projection.byCallId,
      [callId]: state,
    },
  };
}

function asCallId(value: unknown): CallId | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return createCallId(value);
}
