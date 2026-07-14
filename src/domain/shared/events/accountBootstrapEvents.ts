import { createDomainEvent } from "../DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PhoneStatus } from "../PhoneStatus.js";
import type { SipAccountInput } from "../../telephony/SipAccount.js";

export type SipCredentialsReceivedEvent = ReturnType<
  typeof createSipCredentialsReceivedEvent
>;

export type SipCredentialsSource = "manual" | "ocp";

export function createSipCredentialsReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    credentials: SipAccountInput;
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
  payload: Readonly<{ account: SipAccountInput }>,
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

export type AccountBootstrapDomainEvent =
  | ManualSipAuthorizationRequestedEvent
  | AccessDeniedDetectedEvent
  | PhoneStatusChangedEvent
  | StartupModeResolvedEvent
  | SipCredentialsReceivedEvent;
