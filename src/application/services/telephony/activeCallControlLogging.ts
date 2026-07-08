import type { ActiveCallControlOperation } from "@domain/index.js";
import { createActiveCallControlFailedEvent } from "@domain/index.js";
import type { CallId } from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: structured failure logging for active call control operations.
 * - Inputs: logger, operation metadata, platform error, correlation id.
 * - Outputs: error log entry via logger port.
 */
export function logActiveCallControlFailure(
  logger: Logger,
  message: string,
  featureId: string,
  boundedContext: "Telephony" | "Media",
  operation: string,
  previousState: string,
  error: PlatformError,
  correlationId: CorrelationId,
): void {
  logger.error(message, {
    correlationId,
    featureId,
    boundedContext,
    operation,
    previousState,
    nextState: previousState,
    result: error.code,
    normalizedError: error.message,
  });
}

/**
 * - Purpose: publish active call control failure facts for projections.
 * - Inputs: event publisher, call id, operation, error, correlation id.
 * - Outputs: ActiveCallControlFailed domain event.
 */
export function publishActiveCallControlFailed(
  eventPublisher: DomainEventPublisher,
  correlationId: CorrelationId,
  callId: CallId,
  operation: ActiveCallControlOperation,
  error: PlatformError,
): void {
  eventPublisher.publish(
    createActiveCallControlFailedEvent(correlationId, {
      callId,
      operation,
      reason: error.message,
    }),
  );
}
