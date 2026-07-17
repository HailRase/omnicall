import { createDomainEvent } from "../DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PhoneStatus } from "../PhoneStatus.js";

export type SipCredentialIdentity = Readonly<{
  username: string;
  domain: string;
  server: string;
}>;

export type SipCredentialsReceivedEvent = ReturnType<
  typeof createSipCredentialsReceivedEvent
>;

export type SipCredentialsSource = "manual" | "ocp";

export function createSipCredentialsReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    credentials: SipCredentialIdentity;
    source: SipCredentialsSource;
  }>,
) {
  return createDomainEvent("SipCredentialsReceived", correlationId, payload);
}

export type ManualSipAuthorizationRequestedEvent = ReturnType<
  typeof createManualSipAuthorizationRequestedEvent
>;

export function createManualSipAuthorizationRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ account: SipCredentialIdentity }>,
) {
  return createDomainEvent(
    "ManualSipAuthorizationRequested",
    correlationId,
    payload,
  );
}

export type AccessDeniedSource = SipCredentialsSource;

export type AccessDeniedDetectedEvent = ReturnType<
  typeof createAccessDeniedDetectedEvent
>;

export function createAccessDeniedDetectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ source: AccessDeniedSource; reason: string }>,
) {
  return createDomainEvent("AccessDeniedDetected", correlationId, payload);
}

export type PhoneStatusChangedEvent = ReturnType<
  typeof createPhoneStatusChangedEvent
>;

export function createPhoneStatusChangedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ previousStatus: PhoneStatus; nextStatus: PhoneStatus }>,
) {
  return createDomainEvent("PhoneStatusChanged", correlationId, payload);
}

export type StartupModeResolvedEvent = ReturnType<
  typeof createStartupModeResolvedEvent
>;

export type StartupResolution = Readonly<{ action: "sip_only_ready" }>;

export function createStartupModeResolvedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ resolution: StartupResolution }>,
) {
  return createDomainEvent("StartupModeResolved", correlationId, payload);
}

export type AccountSessionActivatedEvent = ReturnType<
  typeof createAccountSessionActivatedEvent
>;

/**
 * - Purpose: mark local account session active (settings unlocked) independent of SIP-ready (ADR-AF-005).
 * - Inputs: correlation id + optional profile key string for observability.
 * - Outputs: Domain Event consumed by bootstrap projection / logout gate.
 */
export function createAccountSessionActivatedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ profileKey?: string }> = {},
) {
  return createDomainEvent("AccountSessionActivated", correlationId, payload);
}

export type AccountBootstrapDomainEvent =
  | ManualSipAuthorizationRequestedEvent
  | AccessDeniedDetectedEvent
  | PhoneStatusChangedEvent
  | StartupModeResolvedEvent
  | SipCredentialsReceivedEvent
  | AccountSessionActivatedEvent;
