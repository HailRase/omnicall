import type {
  CallId,
  CallMediaMode,
  DtmfTone,
  PhoneNumber,
  SipAccount,
  SipAccountId,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type RegisterAccountCommand = Readonly<{
  account: SipAccount;
  correlationId: CorrelationId;
}>;

export type MakeCallCommand = Readonly<{
  callId: CallId;
  number: PhoneNumber;
  mediaMode?: CallMediaMode;
  correlationId: CorrelationId;
}>;

export type MakeCallProgress =
  | Readonly<{ stage: "connecting" }>
  | Readonly<{ stage: "progress"; progressCode: number }>
  | Readonly<{ stage: "answered" }>;

export type SendDtmfCommand = Readonly<{
  callId: CallId;
  tone: DtmfTone;
  correlationId: CorrelationId;
}>;

export type AnswerCallCommand = Readonly<{
  callId: CallId;
  mediaMode?: CallMediaMode;
  correlationId: CorrelationId;
}>;

export type RejectCallCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
  sipCode?: number;
  reason?: string;
}>;

export type TelephonyIncomingCallNotification = Readonly<{
  callId: CallId;
  remoteNumber: string;
  remoteDisplayNameRaw?: string;
  correlationId: CorrelationId;
}>;

export type TelephonyCallEndedNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type TelephonyCallAnsweredNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type TelephonyRemoteHoldNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type TelephonyRemoteResumeNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type TelephonyRemoteVideoPresenceNotification = Readonly<{
  callId: CallId;
  present: boolean;
  correlationId: CorrelationId;
}>;

export type TelephonyCameraAvailabilityNotification = Readonly<{
  callId: CallId;
  available: boolean;
  correlationId: CorrelationId;
}>;

export type TelephonyTransportConnectingNotification = Readonly<{
  correlationId: CorrelationId;
}>;

export type TelephonyTransportConnectedNotification = Readonly<{
  correlationId: CorrelationId;
}>;

export type TelephonyTransportDisconnectedNotification = Readonly<{
  correlationId: CorrelationId;
  reason: string;
}>;

export type TelephonyRegistrationFailedNotification = Readonly<{
  correlationId: CorrelationId;
  reason: string;
  accountId: SipAccountId | null;
}>;

export type HangupCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type HoldCallCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type ResumeCallCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type BlindTransferCommand = Readonly<{
  callId: CallId;
  targetNumber: PhoneNumber;
  correlationId: CorrelationId;
}>;

export type AttendedTransferCommand = Readonly<{
  sourceCallId: CallId;
  consultationCallId: CallId;
  correlationId: CorrelationId;
}>;

export interface TelephonyGateway {
  register(command: RegisterAccountCommand): Promise<Result<void, PlatformError>>;
  unregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
  makeCall(command: MakeCallCommand): Promise<Result<MakeCallProgress, PlatformError>>;
  answerCall(command: AnswerCallCommand): Promise<Result<void, PlatformError>>;
  rejectCall(command: RejectCallCommand): Promise<Result<void, PlatformError>>;
  sendDtmf(command: SendDtmfCommand): Promise<Result<void, PlatformError>>;
  hangup(command: HangupCommand): Promise<Result<void, PlatformError>>;
  holdCall(command: HoldCallCommand): Promise<Result<void, PlatformError>>;
  resumeCall(command: ResumeCallCommand): Promise<Result<void, PlatformError>>;
  blindTransfer(command: BlindTransferCommand): Promise<Result<void, PlatformError>>;
  attendedTransfer(command: AttendedTransferCommand): Promise<Result<void, PlatformError>>;
  setIncomingCallHandler(
    handler: ((notification: TelephonyIncomingCallNotification) => Promise<void>) | null,
  ): () => void;
  setCallEndedHandler(
    handler: ((notification: TelephonyCallEndedNotification) => Promise<void>) | null,
  ): () => void;
  /** Outbound: adapter invokes when JsSIP session confirms after async progress. */
  setCallAnsweredHandler(
    handler: ((notification: TelephonyCallAnsweredNotification) => Promise<void>) | null,
  ): () => void;
  /** Adapter invokes when remote party puts this leg on hold (LF-022). */
  setRemoteHoldHandler(
    handler: ((notification: TelephonyRemoteHoldNotification) => Promise<void>) | null,
  ): () => void;
  /** Adapter invokes when remote party resumes this leg from hold (LF-022). */
  setRemoteResumeHandler(
    handler: ((notification: TelephonyRemoteResumeNotification) => Promise<void>) | null,
  ): () => void;
  /** F-027: adapter invokes after remote SDP video acceptance is known. */
  setRemoteVideoPresenceHandler(
    handler:
      | ((notification: TelephonyRemoteVideoPresenceNotification) => Promise<void>)
      | null,
  ): () => void;
  /** F-027: adapter invokes after local camera probe/capture result is known. */
  setCameraAvailabilityHandler(
    handler:
      | ((notification: TelephonyCameraAvailabilityNotification) => Promise<void>)
      | null,
  ): () => void;
  /** WU2: adapter invokes on SIP transport disconnect (LF-008). */
  setTransportDisconnectedHandler(
    handler: ((notification: TelephonyTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void;
  /** T-008: adapter invokes on SIP WebSocket connecting (ADR-0004). */
  setTransportConnectingHandler(
    handler: ((notification: TelephonyTransportConnectingNotification) => Promise<void>) | null,
  ): () => void;
  /** T-008: adapter invokes on SIP WebSocket connected (ADR-0004). */
  setTransportConnectedHandler(
    handler: ((notification: TelephonyTransportConnectedNotification) => Promise<void>) | null,
  ): () => void;
  /** Mid-session REGISTER failure while transport stays up (LF-008). */
  setRegistrationFailedHandler(
    handler: ((notification: TelephonyRegistrationFailedNotification) => Promise<void>) | null,
  ): () => void;
  /**
   * Tear down SIP transport and create a fresh UA instance (ADR-0004 §1.6).
   * Unregisters all contacts, stops the current UA, starts a new one; transport only.
   */
  reconnectTransport(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
  /**
   * Refresh SIP REGISTER on the live UA: unregister({ all: true }) then register().
   */
  reregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
}
