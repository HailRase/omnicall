import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { AgentStatus } from "../AgentStatus.js";
import type { AgentStatusRejectionReason } from "../AgentStatusTransition.js";
import type { StatusReason } from "../StatusReason.js";

export type AgentStatusChangeRequestedEvent = ReturnType<
  typeof createAgentStatusChangeRequestedEvent
>;

export function createAgentStatusChangeRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    previousStatus: AgentStatus | null;
    targetStatus: AgentStatus;
    reason: StatusReason | null;
  }>,
) {
  return createDomainEvent(
    "AgentStatusChangeRequested",
    correlationId,
    payload,
  );
}

export type AgentStatusChangedEvent = ReturnType<
  typeof createAgentStatusChangedEvent
>;

export function createAgentStatusChangedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    previousStatus: AgentStatus | null;
    currentStatus: AgentStatus;
    reason: StatusReason | null;
    changedAt: string;
  }>,
) {
  return createDomainEvent("AgentStatusChanged", correlationId, payload);
}

export type AgentStatusChangeRejectedEvent = ReturnType<
  typeof createAgentStatusChangeRejectedEvent
>;

export function createAgentStatusChangeRejectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    previousStatus: AgentStatus | null;
    targetStatus: AgentStatus;
    reason: AgentStatusRejectionReason;
  }>,
) {
  return createDomainEvent(
    "AgentStatusChangeRejected",
    correlationId,
    payload,
  );
}

export type AgentStatusDomainEvent =
  | AgentStatusChangeRequestedEvent
  | AgentStatusChangedEvent
  | AgentStatusChangeRejectedEvent;
