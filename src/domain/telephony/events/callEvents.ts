/**
 * - Purpose: represent outgoing call and DTMF domain facts.
 * - Inputs: correlation id and typed call event payloads.
 * - Outputs: immutable domain events for projections and logs.
 */
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { CallId } from "../CallId.js";
import type { CallFailureReason } from "../CallFailureReason.js";
import type { DtmfTone } from "../DtmfTone.js";
import type { PhoneNumber } from "../PhoneNumber.js";

export type OutgoingCallRequestedEvent = ReturnType<
  typeof createOutgoingCallRequestedEvent
>;
export type OutgoingCallStartedEvent = ReturnType<
  typeof createOutgoingCallStartedEvent
>;
export type CallProgressReceivedEvent = ReturnType<
  typeof createCallProgressReceivedEvent
>;
export type CallAnsweredEvent = ReturnType<typeof createCallAnsweredEvent>;
export type CallFailedEvent = ReturnType<typeof createCallFailedEvent>;
export type CallEndedEvent = ReturnType<typeof createCallEndedEvent>;
export type DtmfSentEvent = ReturnType<typeof createDtmfSentEvent>;
export type DtmfFailedEvent = ReturnType<typeof createDtmfFailedEvent>;
export type RemoteAudioAttachedEvent = ReturnType<
  typeof createRemoteAudioAttachedEvent
>;
export type RingbackToneStartedEvent = ReturnType<
  typeof createRingbackToneStartedEvent
>;
export type BusyToneStartedEvent = ReturnType<typeof createBusyToneStartedEvent>;
export type FailedToneStartedEvent = ReturnType<
  typeof createFailedToneStartedEvent
>;

export type OutgoingCallDomainEvent =
  | OutgoingCallRequestedEvent
  | OutgoingCallStartedEvent
  | CallProgressReceivedEvent
  | CallAnsweredEvent
  | CallFailedEvent
  | CallEndedEvent
  | DtmfSentEvent
  | DtmfFailedEvent
  | RemoteAudioAttachedEvent
  | RingbackToneStartedEvent
  | BusyToneStartedEvent
  | FailedToneStartedEvent;

export function createOutgoingCallRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    phoneNumber: PhoneNumber;
  }>,
): ReturnType<typeof createDomainEvent<"OutgoingCallRequested", typeof payload>> {
  return createDomainEvent("OutgoingCallRequested", correlationId, payload);
}

export function createOutgoingCallStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"OutgoingCallStarted", typeof payload>> {
  return createDomainEvent("OutgoingCallStarted", correlationId, payload);
}

export function createCallProgressReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    progressCode: number;
  }>,
): ReturnType<typeof createDomainEvent<"CallProgressReceived", typeof payload>> {
  return createDomainEvent("CallProgressReceived", correlationId, payload);
}

export function createCallAnsweredEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallAnswered", typeof payload>> {
  return createDomainEvent("CallAnswered", correlationId, payload);
}

export function createCallFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    reason: CallFailureReason;
    details: string;
  }>,
): ReturnType<typeof createDomainEvent<"CallFailed", typeof payload>> {
  return createDomainEvent("CallFailed", correlationId, payload);
}

export function createCallEndedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallEnded", typeof payload>> {
  return createDomainEvent("CallEnded", correlationId, payload);
}

export function createDtmfSentEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    tone: DtmfTone;
  }>,
): ReturnType<typeof createDomainEvent<"DtmfSent", typeof payload>> {
  return createDomainEvent("DtmfSent", correlationId, payload);
}

export function createDtmfFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    tone: DtmfTone;
    reason: string;
  }>,
): ReturnType<typeof createDomainEvent<"DtmfFailed", typeof payload>> {
  return createDomainEvent("DtmfFailed", correlationId, payload);
}

export function createRemoteAudioAttachedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"RemoteAudioAttached", typeof payload>> {
  return createDomainEvent("RemoteAudioAttached", correlationId, payload);
}

export function createRingbackToneStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"RingbackToneStarted", typeof payload>> {
  return createDomainEvent("RingbackToneStarted", correlationId, payload);
}

export function createBusyToneStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"BusyToneStarted", typeof payload>> {
  return createDomainEvent("BusyToneStarted", correlationId, payload);
}

export function createFailedToneStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"FailedToneStarted", typeof payload>> {
  return createDomainEvent("FailedToneStarted", correlationId, payload);
}

