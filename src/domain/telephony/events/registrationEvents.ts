import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { SipAccountId } from "../../shared/ids.js";

export type RegistrationRequestedEvent = ReturnType<
  typeof createRegistrationRequestedEvent
>;

export function createRegistrationRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ accountId: SipAccountId }>,
) {
  return createDomainEvent("RegistrationRequested", correlationId, payload);
}

export type RegistrationSucceededEvent = ReturnType<
  typeof createRegistrationSucceededEvent
>;

export function createRegistrationSucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ accountId: SipAccountId }>,
) {
  return createDomainEvent("RegistrationSucceeded", correlationId, payload);
}

export type RegistrationFailedEvent = ReturnType<
  typeof createRegistrationFailedEvent
>;

export function createRegistrationFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ accountId: SipAccountId; reason: string }>,
) {
  return createDomainEvent("RegistrationFailed", correlationId, payload);
}

export type RegistrationDomainEvent =
  | RegistrationRequestedEvent
  | RegistrationSucceededEvent
  | RegistrationFailedEvent;
