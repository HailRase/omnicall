import type { CallId, CallState } from "@domain/index.js";
import {
  createAttendedTransferFailedEvent,
  createConsultationCallFailedEvent,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: structured failure logging for attended transfer operations.
 * - Inputs: logger, state metadata, platform error, correlation id.
 * - Outputs: error log entry via logger port.
 */
export function logAttendedTransferFailure(
  logger: Logger,
  previousState: string,
  nextState: string,
  error: PlatformError,
  correlationId: CorrelationId,
): void {
  logger.error("attended_transfer_failed", {
    correlationId,
    featureId: "F-007",
    boundedContext: "Telephony",
    operation: "attended_transfer",
    previousState,
    nextState,
    result: error.code,
    normalizedError: error.message,
  });
}

/**
 * - Purpose: publish consultation start failure facts for projection rollback.
 * - Inputs: event publisher, call ids, restored source state, failure reason.
 * - Outputs: ConsultationCallFailed domain event.
 */
export function publishConsultationCallFailed(
  eventPublisher: DomainEventPublisher,
  correlationId: CorrelationId,
  sourceCallId: CallId,
  consultationCallId: CallId,
  restoredSourceState: CallState,
  reason: string,
): void {
  eventPublisher.publish(
    createConsultationCallFailedEvent(correlationId, {
      sourceCallId,
      consultationCallId,
      reason,
      restoredSourceState,
    }),
  );
}

/**
 * - Purpose: publish attended transfer failure facts for projections.
 * - Inputs: event publisher, call ids, restored source state, error, correlation id.
 * - Outputs: AttendedTransferFailed domain event.
 */
export function publishAttendedTransferFailed(
  eventPublisher: DomainEventPublisher,
  correlationId: CorrelationId,
  sourceCallId: CallId,
  consultationCallId: CallId,
  restoredSourceState: CallState,
  error: PlatformError,
): void {
  eventPublisher.publish(
    createAttendedTransferFailedEvent(correlationId, {
      sourceCallId,
      consultationCallId,
      reason: error.message,
      restoredSourceState,
    }),
  );
}
