import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type OcpDisconnectReason =
  | "transport_closed"
  | "heartbeat_timeout"
  | "auth_revoked"
  | "unknown";

export type OcpDisconnectedEvent = ReturnType<typeof createOcpDisconnectedEvent>;
export type OcpReconnectScheduledEvent = ReturnType<typeof createOcpReconnectScheduledEvent>;
export type OcpReconnectAttemptStartedEvent = ReturnType<
  typeof createOcpReconnectAttemptStartedEvent
>;
export type OcpReconnectSucceededEvent = ReturnType<typeof createOcpReconnectSucceededEvent>;
export type OcpReconnectFailedEvent = ReturnType<typeof createOcpReconnectFailedEvent>;

/**
 * - Purpose: record OCP WebSocket transport loss (LF-057, LF-058).
 * - Inputs: correlationId, reason, optional message.
 * - Outputs: OcpDisconnected domain event.
 */
export function createOcpDisconnectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    reason: OcpDisconnectReason;
    message?: string;
  }>,
) {
  return createDomainEvent("OcpDisconnected", correlationId, payload);
}

/**
 * - Purpose: announce scheduled OCP reconnect attempt with delay.
 * - Inputs: correlationId, attemptNumber, delayMs.
 * - Outputs: OcpReconnectScheduled domain event.
 */
export function createOcpReconnectScheduledEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    delayMs: number;
  }>,
) {
  return createDomainEvent("OcpReconnectScheduled", correlationId, payload);
}

/**
 * - Purpose: announce in-flight OCP reconnect attempt execution (LF-057).
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: OcpReconnectAttemptStarted domain event.
 */
export function createOcpReconnectAttemptStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("OcpReconnectAttemptStarted", correlationId, payload);
}

/**
 * - Purpose: confirm OCP transport restored after retry.
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: OcpReconnectSucceeded domain event.
 */
export function createOcpReconnectSucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("OcpReconnectSucceeded", correlationId, payload);
}

/**
 * - Purpose: record failed OCP reconnect attempt.
 * - Inputs: correlationId, attemptNumber, reason, isTerminal.
 * - Outputs: OcpReconnectFailed domain event.
 */
export function createOcpReconnectFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    reason: string;
    isTerminal: boolean;
  }>,
) {
  return createDomainEvent("OcpReconnectFailed", correlationId, payload);
}

export type OcpRecoveryDomainEvent =
  | OcpDisconnectedEvent
  | OcpReconnectScheduledEvent
  | OcpReconnectAttemptStartedEvent
  | OcpReconnectSucceededEvent
  | OcpReconnectFailedEvent;
