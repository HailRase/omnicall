import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type SipSessionActivatedEvent = ReturnType<typeof createSipSessionActivatedEvent>;
export type SipSessionResetEvent = ReturnType<typeof createSipSessionResetEvent>;
export type SipTransportConnectingEvent = ReturnType<typeof createSipTransportConnectingEvent>;
export type SipTransportConnectedEvent = ReturnType<typeof createSipTransportConnectedEvent>;
export type SipTransportDisconnectedEvent = ReturnType<typeof createSipTransportDisconnectedEvent>;
export type SipTransportReconnectScheduledEvent = ReturnType<
  typeof createSipTransportReconnectScheduledEvent
>;
export type SipTransportReconnectAttemptStartedEvent = ReturnType<
  typeof createSipTransportReconnectAttemptStartedEvent
>;
export type SipTransportReconnectSucceededEvent = ReturnType<
  typeof createSipTransportReconnectSucceededEvent
>;
export type SipTransportReconnectFailedEvent = ReturnType<
  typeof createSipTransportReconnectFailedEvent
>;
export type SipRegistrationClearedEvent = ReturnType<typeof createSipRegistrationClearedEvent>;
export type ManualSipTransportReconnectRequestedEvent = ReturnType<
  typeof createManualSipTransportReconnectRequestedEvent
>;
export type ManualSipReregisterRequestedEvent = ReturnType<
  typeof createManualSipReregisterRequestedEvent
>;

/**
 * - Purpose: mark first auth/register attempt — lifecycle active (ADR-0004).
 * - Inputs: correlationId.
 * - Outputs: SipSessionActivated domain event.
 */
export function createSipSessionActivatedEvent(correlationId: CorrelationId) {
  return createDomainEvent("SipSessionActivated", correlationId, {});
}

/**
 * - Purpose: mark logout/teardown — lifecycle idle (ADR-0004).
 * - Inputs: correlationId.
 * - Outputs: SipSessionReset domain event.
 */
export function createSipSessionResetEvent(correlationId: CorrelationId) {
  return createDomainEvent("SipSessionReset", correlationId, {});
}

/**
 * - Purpose: announce WebSocket connect in progress.
 * - Inputs: correlationId.
 * - Outputs: SipTransportConnecting domain event.
 */
export function createSipTransportConnectingEvent(correlationId: CorrelationId) {
  return createDomainEvent("SipTransportConnecting", correlationId, {});
}

/**
 * - Purpose: announce WebSocket connected.
 * - Inputs: correlationId.
 * - Outputs: SipTransportConnected domain event.
 */
export function createSipTransportConnectedEvent(correlationId: CorrelationId) {
  return createDomainEvent("SipTransportConnected", correlationId, {});
}

/**
 * - Purpose: announce WebSocket disconnected (non-intentional).
 * - Inputs: correlationId, optional reason.
 * - Outputs: SipTransportDisconnected domain event.
 */
export function createSipTransportDisconnectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ reason?: string }> = {},
) {
  return createDomainEvent("SipTransportDisconnected", correlationId, payload);
}

/**
 * - Purpose: announce scheduled transport reconnect attempt.
 * - Inputs: correlationId, attemptNumber, delayMs.
 * - Outputs: SipTransportReconnectScheduled domain event.
 */
export function createSipTransportReconnectScheduledEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    delayMs: number;
  }>,
) {
  return createDomainEvent("SipTransportReconnectScheduled", correlationId, payload);
}

/**
 * - Purpose: mark in-flight transport reconnect attempt.
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: SipTransportReconnectAttemptStarted domain event.
 */
export function createSipTransportReconnectAttemptStartedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("SipTransportReconnectAttemptStarted", correlationId, payload);
}

/**
 * - Purpose: confirm transport restored (does not imply REGISTER success).
 * - Inputs: correlationId, attemptNumber.
 * - Outputs: SipTransportReconnectSucceeded domain event.
 */
export function createSipTransportReconnectSucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
  }>,
) {
  return createDomainEvent("SipTransportReconnectSucceeded", correlationId, payload);
}

/**
 * - Purpose: record failed transport reconnect attempt.
 * - Inputs: correlationId, attemptNumber, reason, isTerminal.
 * - Outputs: SipTransportReconnectFailed domain event.
 */
export function createSipTransportReconnectFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    attemptNumber: number;
    reason: string;
    isTerminal: boolean;
  }>,
) {
  return createDomainEvent("SipTransportReconnectFailed", correlationId, payload);
}

/**
 * - Purpose: invalidate registration projection on transport loss (ADR-0004).
 * - Inputs: correlationId, optional reason.
 * - Outputs: SipRegistrationCleared domain event.
 */
export function createSipRegistrationClearedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ reason?: string }> = {},
) {
  return createDomainEvent("SipRegistrationCleared", correlationId, payload);
}

/**
 * - Purpose: user manual socket reconnect from settings (ADR-0004 §1.6).
 * - Inputs: correlationId.
 * - Outputs: ManualSipTransportReconnectRequested domain event.
 */
export function createManualSipTransportReconnectRequestedEvent(correlationId: CorrelationId) {
  return createDomainEvent("ManualSipTransportReconnectRequested", correlationId, {});
}

/**
 * - Purpose: user manual SIP REGISTER from settings (ADR-0004 §1.6).
 * - Inputs: correlationId.
 * - Outputs: ManualSipReregisterRequested domain event.
 */
export function createManualSipReregisterRequestedEvent(correlationId: CorrelationId) {
  return createDomainEvent("ManualSipReregisterRequested", correlationId, {});
}

export type SipTransportDomainEvent =
  | SipSessionActivatedEvent
  | SipSessionResetEvent
  | SipTransportConnectingEvent
  | SipTransportConnectedEvent
  | SipTransportDisconnectedEvent
  | SipTransportReconnectScheduledEvent
  | SipTransportReconnectAttemptStartedEvent
  | SipTransportReconnectSucceededEvent
  | SipTransportReconnectFailedEvent
  | SipRegistrationClearedEvent
  | ManualSipTransportReconnectRequestedEvent
  | ManualSipReregisterRequestedEvent;
