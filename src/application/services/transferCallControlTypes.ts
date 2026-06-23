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
 * - Purpose: shared dependency contracts for blind transfer operations.
 * - Inputs: gateway ports, event publisher, logger, call tracking callbacks.
 * - Outputs: typed deps and blind transfer input contract.
 */
export type TrackedCallResolver = (
  callId: CallId,
) => Result<Call, PlatformError>;

export type TrackCallUpdater = (call: Call) => void;
export type IncomingCallClearer = (callId: CallId) => void;

export type TransferCallControlDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  mediaGateway: MediaGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  resolveTrackedCall: TrackedCallResolver;
  trackCall: TrackCallUpdater;
  clearIncomingCallById: IncomingCallClearer;
}>;

export type BlindTransferInput = Readonly<{
  callId: CallId;
  targetNumber: string;
  correlationId?: CorrelationId;
}>;
