import type { Call, CallId, DtmfTone, PhoneNumber } from "@domain/index.js";
import type { TelephonyIncomingCallNotification } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

/**
 * - Purpose: typed inputs for CallEngine orchestration methods.
 * - Inputs: call identifiers, phone numbers, gateway notifications.
 * - Outputs: readonly input contracts for application services.
 */
export type MakeCallInput = Readonly<{
  phoneNumber: PhoneNumber;
  callId?: CallId;
  correlationId?: CorrelationId;
}>;

export type SendDtmfInput = Readonly<{
  callId: CallId;
  tone: DtmfTone;
  correlationId?: CorrelationId;
}>;

export type HangupCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type HoldCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type ResumeCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type MuteCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type UnmuteCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type BlindTransferInput = Readonly<{
  callId: CallId;
  targetNumber: string;
  correlationId?: CorrelationId;
}>;

export type HandleCallProgressInput = Readonly<{
  call: Call;
  progressCode: number;
  correlationId?: CorrelationId;
}>;

export type HandleCallAnsweredInput = Readonly<{
  call: Call;
  correlationId?: CorrelationId;
}>;

export type HandleCallFailedInput = Readonly<{
  call: Call;
  failure: string;
  correlationId?: CorrelationId;
}>;

export type AnswerCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
  autoAnswered?: boolean;
  timeoutSec?: number;
}>;

export type RejectCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
  breakReason?: string;
  sipCode?: number;
}>;

export type HandleIncomingCallInput = Readonly<{
  notification: TelephonyIncomingCallNotification;
}>;
