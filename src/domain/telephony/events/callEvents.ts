/**
 * - Purpose: represent call lifecycle and DTMF domain facts.
 * - Inputs: correlation id and typed call event payloads.
 * - Outputs: immutable domain events for projections and logs.
 */
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { MultiCallOperationRejectedEvent } from "./MultiCallOperationRejected.js";
import type { CallId } from "../CallId.js";
import type { CallState } from "../CallState.js";
import type { CallFailureReason } from "../CallFailureReason.js";
import type { DtmfTone } from "../DtmfTone.js";
import type { PhoneNumber } from "../PhoneNumber.js";

export type OutgoingCallRequestedEvent = ReturnType<
  typeof createOutgoingCallRequestedEvent
>;
export type OutgoingCallStartedEvent = ReturnType<
  typeof createOutgoingCallStartedEvent
>;
export type IncomingCallReceivedEvent = ReturnType<
  typeof createIncomingCallReceivedEvent
>;
export type IncomingCallRingingStartedEvent = ReturnType<
  typeof createIncomingCallRingingStartedEvent
>;
export type IncomingCallDisplayNameResolvedEvent = ReturnType<
  typeof createIncomingCallDisplayNameResolvedEvent
>;
export type CallProgressReceivedEvent = ReturnType<
  typeof createCallProgressReceivedEvent
>;
export type CallAnsweredEvent = ReturnType<typeof createCallAnsweredEvent>;
export type CallRejectedEvent = ReturnType<typeof createCallRejectedEvent>;
export type CallAutoAnsweredEvent = ReturnType<typeof createCallAutoAnsweredEvent>;
export type CallRejectedByDndEvent = ReturnType<typeof createCallRejectedByDndEvent>;
export type CallRejectReasonSelectedEvent = ReturnType<
  typeof createCallRejectReasonSelectedEvent
>;
export type IncomingCallEndedBeforeAnswerEvent = ReturnType<
  typeof createIncomingCallEndedBeforeAnswerEvent
>;
export type CallFailedEvent = ReturnType<typeof createCallFailedEvent>;
export type CallHangupRequestedEvent = ReturnType<
  typeof createCallHangupRequestedEvent
>;
export type CallEndedEvent = ReturnType<typeof createCallEndedEvent>;
export type CallHeldEvent = ReturnType<typeof createCallHeldEvent>;
export type CallResumedEvent = ReturnType<typeof createCallResumedEvent>;
export type CallMutedEvent = ReturnType<typeof createCallMutedEvent>;
export type CallUnmutedEvent = ReturnType<typeof createCallUnmutedEvent>;
export type ActiveCallControlOperation =
  | "hold"
  | "resume"
  | "mute"
  | "unmute"
  | "hangup";
export type ActiveCallControlFailedEvent = ReturnType<
  typeof createActiveCallControlFailedEvent
>;
export type DtmfSentEvent = ReturnType<typeof createDtmfSentEvent>;
export type DtmfFailedEvent = ReturnType<typeof createDtmfFailedEvent>;
export type RemoteAudioAttachedEvent = ReturnType<
  typeof createRemoteAudioAttachedEvent
>;
export type RingbackToneStartedEvent = ReturnType<
  typeof createRingbackToneStartedEvent
>;
export type IncomingRingtoneStartedEvent = ReturnType<
  typeof createIncomingRingtoneStartedEvent
>;
export type IncomingRingtoneStoppedEvent = ReturnType<
  typeof createIncomingRingtoneStoppedEvent
>;
export type BusyToneStartedEvent = ReturnType<typeof createBusyToneStartedEvent>;
export type FailedToneStartedEvent = ReturnType<
  typeof createFailedToneStartedEvent
>;
export type ToneStoppedEvent = ReturnType<typeof createToneStoppedEvent>;
export type AllOtherCallsHeldEvent = ReturnType<typeof createAllOtherCallsHeldEvent>;
export type SecondSessionBlockedEvent = ReturnType<
  typeof createSecondSessionBlockedEvent
>;
export type CallTransferRequestedEvent = ReturnType<
  typeof createCallTransferRequestedEvent
>;
export type CallTransferredEvent = ReturnType<typeof createCallTransferredEvent>;
export type CallTransferFailedEvent = ReturnType<typeof createCallTransferFailedEvent>;
export type ConsultationCallRequestedEvent = ReturnType<
  typeof createConsultationCallRequestedEvent
>;
export type ConsultationCallStartedEvent = ReturnType<
  typeof createConsultationCallStartedEvent
>;
export type ConsultationCallFailedEvent = ReturnType<
  typeof createConsultationCallFailedEvent
>;
export type AttendedTransferRequestedEvent = ReturnType<
  typeof createAttendedTransferRequestedEvent
>;
export type AttendedTransferCompletedEvent = ReturnType<
  typeof createAttendedTransferCompletedEvent
>;
export type AttendedTransferFailedEvent = ReturnType<
  typeof createAttendedTransferFailedEvent
>;
export type TransferModeStartedEvent = ReturnType<typeof createTransferModeStartedEvent>;
export type TransferModeCancelledEvent = ReturnType<typeof createTransferModeCancelledEvent>;
export type CallAutoUnheldAfterTransferFailureEvent = ReturnType<
  typeof createCallAutoUnheldAfterTransferFailureEvent
>;
export type TransferType = "blind" | "attended";
export type HoldAllPhase = "in_progress" | "completed" | "failed";
export type HoldAllTrigger = "before_outgoing" | "before_incoming_answer";

export type OutgoingCallDomainEvent =
  | OutgoingCallRequestedEvent
  | OutgoingCallStartedEvent
  | IncomingCallReceivedEvent
  | IncomingCallRingingStartedEvent
  | IncomingCallDisplayNameResolvedEvent
  | CallProgressReceivedEvent
  | CallAnsweredEvent
  | CallRejectedEvent
  | CallAutoAnsweredEvent
  | CallRejectedByDndEvent
  | CallRejectReasonSelectedEvent
  | IncomingCallEndedBeforeAnswerEvent
  | CallFailedEvent
  | CallHangupRequestedEvent
  | CallEndedEvent
  | CallHeldEvent
  | CallResumedEvent
  | CallMutedEvent
  | CallUnmutedEvent
  | ActiveCallControlFailedEvent
  | DtmfSentEvent
  | DtmfFailedEvent
  | RemoteAudioAttachedEvent
  | RingbackToneStartedEvent
  | IncomingRingtoneStartedEvent
  | IncomingRingtoneStoppedEvent
  | BusyToneStartedEvent
  | FailedToneStartedEvent
  | ToneStoppedEvent
  | AllOtherCallsHeldEvent
  | SecondSessionBlockedEvent
  | MultiCallOperationRejectedEvent
  | CallTransferRequestedEvent
  | CallTransferredEvent
  | CallTransferFailedEvent
  | ConsultationCallRequestedEvent
  | ConsultationCallStartedEvent
  | ConsultationCallFailedEvent
  | AttendedTransferRequestedEvent
  | AttendedTransferCompletedEvent
  | AttendedTransferFailedEvent
  | TransferModeStartedEvent
  | TransferModeCancelledEvent
  | CallAutoUnheldAfterTransferFailureEvent;

export type IncomingCallDomainEvent =
  | IncomingCallReceivedEvent
  | IncomingCallRingingStartedEvent
  | IncomingCallDisplayNameResolvedEvent
  | CallAnsweredEvent
  | CallRejectedEvent
  | CallAutoAnsweredEvent
  | CallRejectedByDndEvent
  | CallRejectReasonSelectedEvent
  | IncomingCallEndedBeforeAnswerEvent
  | CallHangupRequestedEvent
  | CallEndedEvent
  | CallHeldEvent
  | CallResumedEvent
  | CallMutedEvent
  | CallUnmutedEvent
  | ActiveCallControlFailedEvent
  | CallFailedEvent
  | AllOtherCallsHeldEvent
  | SecondSessionBlockedEvent
  | MultiCallOperationRejectedEvent
  | CallTransferRequestedEvent
  | CallTransferredEvent
  | CallTransferFailedEvent
  | ConsultationCallRequestedEvent
  | ConsultationCallStartedEvent
  | ConsultationCallFailedEvent
  | AttendedTransferRequestedEvent
  | AttendedTransferCompletedEvent
  | AttendedTransferFailedEvent
  | TransferModeStartedEvent
  | TransferModeCancelledEvent
  | CallAutoUnheldAfterTransferFailureEvent;

export type CallDomainEvent = OutgoingCallDomainEvent | IncomingCallDomainEvent;

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

export function createIncomingCallReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    phoneNumber: PhoneNumber;
    direction: "incoming";
  }>,
): ReturnType<typeof createDomainEvent<"IncomingCallReceived", typeof payload>> {
  return createDomainEvent("IncomingCallReceived", correlationId, payload);
}

export function createIncomingCallRingingStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    autoAnswerTimeoutSec: number | null;
    autoAnswerExpiresAt: string | null;
  }>,
): ReturnType<
  typeof createDomainEvent<"IncomingCallRingingStarted", typeof payload>
> {
  return createDomainEvent("IncomingCallRingingStarted", correlationId, payload);
}

export function createIncomingCallDisplayNameResolvedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    displayName: string;
  }>,
): ReturnType<
  typeof createDomainEvent<"IncomingCallDisplayNameResolved", typeof payload>
> {
  return createDomainEvent("IncomingCallDisplayNameResolved", correlationId, payload);
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

export function createCallRejectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    reason: string | null;
  }>,
): ReturnType<typeof createDomainEvent<"CallRejected", typeof payload>> {
  return createDomainEvent("CallRejected", correlationId, payload);
}

export function createCallAutoAnsweredEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    timeoutSec: number;
  }>,
): ReturnType<typeof createDomainEvent<"CallAutoAnswered", typeof payload>> {
  return createDomainEvent("CallAutoAnswered", correlationId, payload);
}

export function createCallRejectedByDndEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    sipCode: 486;
  }>,
): ReturnType<typeof createDomainEvent<"CallRejectedByDnd", typeof payload>> {
  return createDomainEvent("CallRejectedByDnd", correlationId, payload);
}

export function createCallRejectReasonSelectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    breakReason: string;
  }>,
): ReturnType<
  typeof createDomainEvent<"CallRejectReasonSelected", typeof payload>
> {
  return createDomainEvent("CallRejectReasonSelected", correlationId, payload);
}

export function createIncomingCallEndedBeforeAnswerEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<
  typeof createDomainEvent<"IncomingCallEndedBeforeAnswer", typeof payload>
> {
  return createDomainEvent("IncomingCallEndedBeforeAnswer", correlationId, payload);
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

export function createCallHangupRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallHangupRequested", typeof payload>> {
  return createDomainEvent("CallHangupRequested", correlationId, payload);
}

export function createCallEndedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallEnded", typeof payload>> {
  return createDomainEvent("CallEnded", correlationId, payload);
}

export function createCallHeldEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallHeld", typeof payload>> {
  return createDomainEvent("CallHeld", correlationId, payload);
}

export function createCallResumedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallResumed", typeof payload>> {
  return createDomainEvent("CallResumed", correlationId, payload);
}

export function createCallMutedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallMuted", typeof payload>> {
  return createDomainEvent("CallMuted", correlationId, payload);
}

export function createCallUnmutedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"CallUnmuted", typeof payload>> {
  return createDomainEvent("CallUnmuted", correlationId, payload);
}

export function createActiveCallControlFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    operation: ActiveCallControlOperation;
    reason: string;
  }>,
): ReturnType<typeof createDomainEvent<"ActiveCallControlFailed", typeof payload>> {
  return createDomainEvent("ActiveCallControlFailed", correlationId, payload);
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

export function createIncomingRingtoneStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"IncomingRingtoneStarted", typeof payload>> {
  return createDomainEvent("IncomingRingtoneStarted", correlationId, payload);
}

export function createIncomingRingtoneStoppedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"IncomingRingtoneStopped", typeof payload>> {
  return createDomainEvent("IncomingRingtoneStopped", correlationId, payload);
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

export function createToneStoppedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"ToneStopped", typeof payload>> {
  return createDomainEvent("ToneStopped", correlationId, payload);
}

export function createAllOtherCallsHeldEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    heldCallIds: ReadonlyArray<CallId>;
    trigger: HoldAllTrigger;
    phase: HoldAllPhase;
  }>,
): ReturnType<typeof createDomainEvent<"AllOtherCallsHeld", typeof payload>> {
  return createDomainEvent("AllOtherCallsHeld", correlationId, payload);
}

export function createSecondSessionBlockedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    direction: "outgoing" | "incoming_answer";
    reason: "multi_sessions_disabled";
    blockingCallIds: ReadonlyArray<CallId>;
  }>,
): ReturnType<typeof createDomainEvent<"SecondSessionBlocked", typeof payload>> {
  return createDomainEvent("SecondSessionBlocked", correlationId, payload);
}

export function createCallTransferRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    targetNumber: PhoneNumber;
    transferType: TransferType;
  }>,
): ReturnType<typeof createDomainEvent<"CallTransferRequested", typeof payload>> {
  return createDomainEvent("CallTransferRequested", correlationId, payload);
}

export function createCallTransferredEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    targetNumber: PhoneNumber;
    transferType: TransferType;
  }>,
): ReturnType<typeof createDomainEvent<"CallTransferred", typeof payload>> {
  return createDomainEvent("CallTransferred", correlationId, payload);
}

export function createCallTransferFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    targetNumber: PhoneNumber;
    transferType: TransferType;
    reason: string;
    restoredSourceState?: CallState;
  }>,
): ReturnType<typeof createDomainEvent<"CallTransferFailed", typeof payload>> {
  return createDomainEvent("CallTransferFailed", correlationId, payload);
}

export function createConsultationCallRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
    targetNumber: PhoneNumber;
  }>,
): ReturnType<typeof createDomainEvent<"ConsultationCallRequested", typeof payload>> {
  return createDomainEvent("ConsultationCallRequested", correlationId, payload);
}

export function createConsultationCallStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"ConsultationCallStarted", typeof payload>> {
  return createDomainEvent("ConsultationCallStarted", correlationId, payload);
}

export function createConsultationCallFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
    reason: string;
    restoredSourceState: CallState;
  }>,
): ReturnType<typeof createDomainEvent<"ConsultationCallFailed", typeof payload>> {
  return createDomainEvent("ConsultationCallFailed", correlationId, payload);
}

export function createAttendedTransferRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"AttendedTransferRequested", typeof payload>> {
  return createDomainEvent("AttendedTransferRequested", correlationId, payload);
}

export function createAttendedTransferCompletedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"AttendedTransferCompleted", typeof payload>> {
  return createDomainEvent("AttendedTransferCompleted", correlationId, payload);
}

export function createAttendedTransferFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    sourceCallId: CallId;
    consultationCallId: CallId;
    reason: string;
    restoredSourceState: CallState;
  }>,
): ReturnType<typeof createDomainEvent<"AttendedTransferFailed", typeof payload>> {
  return createDomainEvent("AttendedTransferFailed", correlationId, payload);
}

export function createTransferModeStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"TransferModeStarted", typeof payload>> {
  return createDomainEvent("TransferModeStarted", correlationId, payload);
}

export function createTransferModeCancelledEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    restoredSourceState?: CallState;
    consultationCallId?: CallId;
  }>,
): ReturnType<typeof createDomainEvent<"TransferModeCancelled", typeof payload>> {
  return createDomainEvent("TransferModeCancelled", correlationId, payload);
}

export function createCallAutoUnheldAfterTransferFailureEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
  }>,
): ReturnType<
  typeof createDomainEvent<"CallAutoUnheldAfterTransferFailure", typeof payload>
> {
  return createDomainEvent("CallAutoUnheldAfterTransferFailure", correlationId, payload);
}

