import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { StatusReason } from "../StatusReason.js";

export type AgentLogoutRequestedEvent = ReturnType<
  typeof createAgentLogoutRequestedEvent
>;

export function createAgentLogoutRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ reason: StatusReason | null }>,
) {
  return createDomainEvent("AgentLogoutRequested", correlationId, payload);
}

export type AgentLogoutDomainEvent = AgentLogoutRequestedEvent;
