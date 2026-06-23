import type {
  CallId,
  DtmfTone,
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

export type HangupCommand = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
}>;

export interface TelephonyGateway {
  register(command: RegisterAccountCommand): Promise<Result<void, PlatformError>>;
  unregister(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
  makeCall(command: MakeCallCommand): Promise<Result<MakeCallProgress, PlatformError>>;
  sendDtmf(command: SendDtmfCommand): Promise<Result<void, PlatformError>>;
  hangup(command: HangupCommand): Promise<Result<void, PlatformError>>;
}
