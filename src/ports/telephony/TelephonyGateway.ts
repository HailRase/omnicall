import type {
  CallId,
  DtmfTone,
  MainAcallId,
  PhoneNumber,
  SipAccount,
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
  mainAcallId?: MainAcallId;
  correlationId: CorrelationId;
}>;

export type TelephonyCallEndedNotification = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export type TelephonyTransportDisconnectedNotification = Readonly<{
  correlationId: CorrelationId;
  reason: string;
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
  /** WU2: adapter invokes on SIP transport disconnect (LF-008). */
  setTransportDisconnectedHandler(
    handler: ((notification: TelephonyTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void;
}
