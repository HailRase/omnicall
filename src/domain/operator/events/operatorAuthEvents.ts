import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { OcpAuthFailureReason } from "../OperatorSession.js";
import type { OperatorSessionId } from "../../shared/ids.js";
import type { OcpSipCredentials } from "../OperatorSession.js";

export type OcpAuthenticationRequestedEvent = ReturnType<
  typeof createOcpAuthenticationRequestedEvent
>;

export function createOcpAuthenticationRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ token: string; domain: string }>,
) {
  return createDomainEvent(
    "OcpAuthenticationRequested",
    correlationId,
    payload,
  );
}

export type OcpAuthenticationSucceededEvent = ReturnType<
  typeof createOcpAuthenticationSucceededEvent
>;

export function createOcpAuthenticationSucceededEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ sessionId: OperatorSessionId; agentId: string }>,
) {
  return createDomainEvent(
    "OcpAuthenticationSucceeded",
    correlationId,
    payload,
  );
}

export type OcpAuthenticationFailedEvent = ReturnType<
  typeof createOcpAuthenticationFailedEvent
>;

export function createOcpAuthenticationFailedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    reason: OcpAuthFailureReason;
    message: string;
  }>,
) {
  return createDomainEvent("OcpAuthenticationFailed", correlationId, payload);
}

export type SipCredentialsReceivedEvent = ReturnType<
  typeof createSipCredentialsReceivedEvent
>;

export function createSipCredentialsReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ credentials: OcpSipCredentials; source: "ocp" | "manual" }>,
) {
  return createDomainEvent("SipCredentialsReceived", correlationId, payload);
}

export type OperatorAuthDomainEvent =
  | OcpAuthenticationRequestedEvent
  | OcpAuthenticationSucceededEvent
  | OcpAuthenticationFailedEvent
  | SipCredentialsReceivedEvent;
