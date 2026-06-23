import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type SipReconnectScheduledEvent = ReturnType<typeof createSipReconnectScheduledEvent>;
export type SipReconnectSucceededEvent = ReturnType<typeof createSipReconnectSucceededEvent>;
export type SipReconnectFailedEvent = ReturnType<typeof createSipReconnectFailedEvent>;

/**
 * - Purpose: announce scheduled SIP registration reconnect attempt (LF-008).
 * - Inputs: correlationId, attemptNumber, delayMs.
 * - Outputs: SipReconnectScheduled domain event.
 */
export function createSipReconnectScheduledEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    delayMs: number;
  }>,
) {
  return createDomainEvent("SipReconnectScheduled", correlationId, payload);
}

/**
 * - Purpose: confirm SIP registration restored after retry.
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: SipReconnectSucceeded domain event.
 */
export function createSipReconnectSucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("SipReconnectSucceeded", correlationId, payload);
}

/**
 * - Purpose: record failed SIP reconnect attempt.
 * - Inputs: correlationId, attemptNumber, reason, isTerminal.
 * - Outputs: SipReconnectFailed domain event.
 */
export function createSipReconnectFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    reason: string;
    isTerminal: boolean;
  }>,
) {
  return createDomainEvent("SipReconnectFailed", correlationId, payload);
}

export type SipRecoveryDomainEvent =
  | SipReconnectScheduledEvent
  | SipReconnectSucceededEvent
  | SipReconnectFailedEvent;
