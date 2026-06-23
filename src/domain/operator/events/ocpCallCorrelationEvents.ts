import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallId } from "../../telephony/CallId.js";
import type { MainAcallId } from "../ocp/MainAcallId.js";

export type OcpCallCorrelationRegisteredEvent = ReturnType<
  typeof createOcpCallCorrelationRegisteredEvent
>;

/**
 * - Purpose: observability when CallId links to OCP main_acallid.
 * - Inputs: correlationId, callId, mainAcallId.
 * - Outputs: OcpCallCorrelationRegistered domain event.
 */
export function createOcpCallCorrelationRegisteredEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    mainAcallId: MainAcallId;
  }>,
) {
  return createDomainEvent("OcpCallCorrelationRegistered", correlationId, payload);
}
