import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type SipRegistrationRetryScheduledEvent = ReturnType<
  typeof createSipRegistrationRetryScheduledEvent
>;
export type SipRegistrationRetryAttemptStartedEvent = ReturnType<
  typeof createSipRegistrationRetryAttemptStartedEvent
>;
export type SipRegistrationRetrySucceededEvent = ReturnType<
  typeof createSipRegistrationRetrySucceededEvent
>;
export type SipRegistrationRetryFailedEvent = ReturnType<
  typeof createSipRegistrationRetryFailedEvent
>;

/**
 * - Purpose: announce scheduled SIP REGISTER retry on live transport (LF-008).
 * - Inputs: correlationId, attemptNumber, delayMs.
 * - Outputs: SipRegistrationRetryScheduled domain event.
 */
export function createSipRegistrationRetryScheduledEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    delayMs: number;
  }>,
) {
  return createDomainEvent("SipRegistrationRetryScheduled", correlationId, payload);
}

/**
 * - Purpose: mark in-flight SIP REGISTER retry attempt (LF-057).
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: SipRegistrationRetryAttemptStarted domain event.
 */
export function createSipRegistrationRetryAttemptStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("SipRegistrationRetryAttemptStarted", correlationId, payload);
}

/**
 * - Purpose: confirm SIP registration restored after REGISTER retry.
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: SipRegistrationRetrySucceeded domain event.
 */
export function createSipRegistrationRetrySucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("SipRegistrationRetrySucceeded", correlationId, payload);
}

/**
 * - Purpose: record failed SIP REGISTER retry attempt.
 * - Inputs: correlationId, attemptNumber, reason, isTerminal.
 * - Outputs: SipRegistrationRetryFailed domain event.
 */
export function createSipRegistrationRetryFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    reason: string;
    isTerminal: boolean;
  }>,
) {
  return createDomainEvent("SipRegistrationRetryFailed", correlationId, payload);
}

export type SipRegistrationRetryDomainEvent =
  | SipRegistrationRetryScheduledEvent
  | SipRegistrationRetryAttemptStartedEvent
  | SipRegistrationRetrySucceededEvent
  | SipRegistrationRetryFailedEvent;
