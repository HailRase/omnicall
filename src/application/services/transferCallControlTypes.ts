import type { Call, CallId, TransferSession } from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  MediaGateway,
  SettingsRepository,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { MakeCallInput } from "./callEngineTypes.js";
import type { HangupCallInput, ResumeCallInput } from "./activeCallControlTypes.js";

/**
 * - Purpose: shared dependency contracts for transfer control operations.
 * - Inputs: gateway ports, event publisher, logger, call tracking callbacks.
 * - Outputs: typed deps and transfer command input contracts.
 */
export type TrackedCallResolver = (
  callId: CallId,
) => Result<Call, PlatformError>;

export type TrackCallUpdater = (call: Call) => void;
export type IncomingCallClearer = (callId: CallId) => void;
export type TransferSessionReader = () => TransferSession | null;
export type TransferSessionWriter = (session: TransferSession | null) => void;
export type MakeCallExecutor = (
  input: MakeCallInput,
) => Promise<Result<Call, PlatformError>>;
export type HangupCallExecutor = (
  input: HangupCallInput,
) => Promise<Result<Call, PlatformError>>;
export type ResumeCallExecutor = (
  input: ResumeCallInput,
) => Promise<Result<Call, PlatformError>>;

export type TransferCallControlDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  settingsRepository: SettingsRepository;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  resolveTrackedCall: TrackedCallResolver;
  trackCall: TrackCallUpdater;
  clearIncomingCallById: IncomingCallClearer;
  getTransferSession: TransferSessionReader;
  setTransferSession: TransferSessionWriter;
  makeCall: MakeCallExecutor;
  hangupCall: HangupCallExecutor;
  resumeCall: ResumeCallExecutor;
}>;

export type BlindTransferInput = Readonly<{
  callId: CallId;
  targetNumber: string;
  correlationId?: CorrelationId;
}>;

export type StartConsultationInput = Readonly<{
  sourceCallId: CallId;
  targetNumber: string;
  consultationCallId?: CallId;
  correlationId?: CorrelationId;
}>;

export type AttendedTransferInput = Readonly<{
  sourceCallId: CallId;
  consultationCallId: CallId;
  correlationId?: CorrelationId;
}>;

export type CancelTransferInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export type StartTransferModeInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;
