import type { CallId, CallState, PhoneNumber } from "@domain/index.js";
import { createCallTransferFailedEvent } from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: structured failure logging for blind transfer operations.
 * - Inputs: logger, operation metadata, platform error, correlation id.
 * - Outputs: error log entry via logger port.
 */
export function logBlindTransferFailure(
  logger: Logger,
  message: string,
  operation: string,
  previousState: string,
  nextState: string,
  error: PlatformError,
  correlationId: CorrelationId,
): void {
  logger.error(message, {
    correlationId,
    featureId: "F-006",
    boundedContext: "Telephony",
    operation,
    previousState,
    nextState,
    result: error.code,
    normalizedError: error.message,
  });
}

/**
 * - Purpose: publish blind transfer failure facts for projections.
 * - Inputs: event publisher, call id, target, error, correlation id.
 * - Outputs: CallTransferFailed domain event.
 */
export function publishCallTransferFailed(
  eventPublisher: DomainEventPublisher,
  correlationId: CorrelationId,
  callId: CallId,
  targetNumber: PhoneNumber,
  error: PlatformError,
  restoredSourceState?: CallState,
): void {
  eventPublisher.publish(
    createCallTransferFailedEvent(correlationId, {
      callId,
      targetNumber,
      transferType: "blind",
      reason: error.message,
      ...(restoredSourceState !== undefined ? { restoredSourceState } : {}),
    }),
  );
}
