/**
 * - Purpose: Domain events for per-call video media facts.
 * - Inputs: correlation id and typed video media payloads.
 * - Outputs: immutable domain events for projections and logs.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { CallId } from "@domain/telephony/CallId.js";
import type { CallMediaMode } from "../CallMediaMode.js";
import type { LocalVideoSource } from "../LocalVideoSource.js";
import type { SessionViewMode } from "../SessionViewMode.js";

export type CallMediaModeSelectedEvent = ReturnType<
  typeof createCallMediaModeSelectedEvent
>;
export type LocalVideoMutedChangedEvent = ReturnType<
  typeof createLocalVideoMutedChangedEvent
>;
export type LocalVideoSourceChangedEvent = ReturnType<
  typeof createLocalVideoSourceChangedEvent
>;
export type RemoteVideoPresenceChangedEvent = ReturnType<
  typeof createRemoteVideoPresenceChangedEvent
>;
export type SessionViewModeChangedEvent = ReturnType<
  typeof createSessionViewModeChangedEvent
>;
export type CameraAvailabilityChangedEvent = ReturnType<
  typeof createCameraAvailabilityChangedEvent
>;
export type IncomingRemoteVideoOfferedChangedEvent = ReturnType<
  typeof createIncomingRemoteVideoOfferedChangedEvent
>;
export type CallDowngradedToAudioOnlyEvent = ReturnType<
  typeof createCallDowngradedToAudioOnlyEvent
>;

export type VideoMediaDomainEvent =
  | CallMediaModeSelectedEvent
  | LocalVideoMutedChangedEvent
  | LocalVideoSourceChangedEvent
  | RemoteVideoPresenceChangedEvent
  | SessionViewModeChangedEvent
  | CameraAvailabilityChangedEvent
  | IncomingRemoteVideoOfferedChangedEvent
  | CallDowngradedToAudioOnlyEvent;

export function createCallMediaModeSelectedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  mediaMode: CallMediaMode,
): ReturnType<
  typeof createDomainEvent<"CallMediaModeSelected", { callId: CallId; mediaMode: CallMediaMode }>
> {
  return createDomainEvent("CallMediaModeSelected", correlationId, {
    callId,
    mediaMode,
  });
}

export function createLocalVideoMutedChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  muted: boolean,
): ReturnType<
  typeof createDomainEvent<"LocalVideoMutedChanged", { callId: CallId; muted: boolean }>
> {
  return createDomainEvent("LocalVideoMutedChanged", correlationId, {
    callId,
    muted,
  });
}

export function createLocalVideoSourceChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  source: LocalVideoSource,
): ReturnType<
  typeof createDomainEvent<
    "LocalVideoSourceChanged",
    { callId: CallId; source: LocalVideoSource }
  >
> {
  return createDomainEvent("LocalVideoSourceChanged", correlationId, {
    callId,
    source,
  });
}

export function createRemoteVideoPresenceChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  present: boolean,
): ReturnType<
  typeof createDomainEvent<
    "RemoteVideoPresenceChanged",
    { callId: CallId; present: boolean }
  >
> {
  return createDomainEvent("RemoteVideoPresenceChanged", correlationId, {
    callId,
    present,
  });
}

export function createSessionViewModeChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  sessionView: SessionViewMode,
): ReturnType<
  typeof createDomainEvent<
    "SessionViewModeChanged",
    { callId: CallId; sessionView: SessionViewMode }
  >
> {
  return createDomainEvent("SessionViewModeChanged", correlationId, {
    callId,
    sessionView,
  });
}

export function createCameraAvailabilityChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  available: boolean,
): ReturnType<
  typeof createDomainEvent<
    "CameraAvailabilityChanged",
    { callId: CallId; available: boolean }
  >
> {
  return createDomainEvent("CameraAvailabilityChanged", correlationId, {
    callId,
    available,
  });
}

/**
 * - Purpose: signal whether the ringing inbound offer includes active video.
 * - Inputs: correlation id, call id, offered flag from remote SDP.
 * - Outputs: IncomingRemoteVideoOfferedChanged domain event.
 */
export function createIncomingRemoteVideoOfferedChangedEvent(
  correlationId: CorrelationId,
  callId: CallId,
  offered: boolean,
): ReturnType<
  typeof createDomainEvent<
    "IncomingRemoteVideoOfferedChanged",
    { callId: CallId; offered: boolean }
  >
> {
  return createDomainEvent("IncomingRemoteVideoOfferedChanged", correlationId, {
    callId,
    offered,
  });
}

/**
 * - Purpose: signal outbound video call fell back to audio-only after remote answer.
 * - Inputs: correlation id, call id, semantic downgrade reason key.
 * - Outputs: CallDowngradedToAudioOnly domain event for UI notification.
 */
export function createCallDowngradedToAudioOnlyEvent(
  correlationId: CorrelationId,
  callId: CallId,
  reason: "remote_audio_only",
): ReturnType<
  typeof createDomainEvent<
    "CallDowngradedToAudioOnly",
    { callId: CallId; reason: "remote_audio_only" }
  >
> {
  return createDomainEvent("CallDowngradedToAudioOnly", correlationId, {
    callId,
    reason,
  });
}
