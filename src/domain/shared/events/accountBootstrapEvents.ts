import { createDomainEvent } from "../DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { BootstrapMode } from "../../settings/BootstrapConfig.js";
import type { PhoneStatus } from "../PhoneStatus.js";
import type { SipAccountInput } from "../../telephony/SipAccount.js";

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

export type AccessDeniedSource = "ocp" | "manual";

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

export type StartupResolution =
  | Readonly<{ action: "sip_only_ready" }>
  | Readonly<{ action: "ocp_authenticate"; token: string; domain: string }>
  | Readonly<{ action: "access_denied"; reason: string }>;

export function createStartupModeResolvedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ mode: BootstrapMode; resolution: StartupResolution }>,
) {
  return createDomainEvent("StartupModeResolved", correlationId, payload);
}

export type AccountBootstrapDomainEvent =
  | ManualSipAuthorizationRequestedEvent
  | AccessDeniedDetectedEvent
  | PhoneStatusChangedEvent
  | StartupModeResolvedEvent;
