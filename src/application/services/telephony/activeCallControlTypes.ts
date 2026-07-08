import type { Call, CallId } from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  MediaGateway,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: shared dependency contracts for active call control operations.
 * - Inputs: gateway ports, event publisher, logger, call tracking callbacks.
 * - Outputs: typed deps and operation input contracts.
 */
export type TrackedCallResolver = (
  callId: CallId,
) => Result<Call, PlatformError>;

export type TrackCallUpdater = (call: Call) => void;
export type IncomingCallClearer = (callId: CallId) => void;

export type ActiveCallControlDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  resolveTrackedCall: TrackedCallResolver;
  trackCall: TrackCallUpdater;
  clearIncomingCallById: IncomingCallClearer;
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
