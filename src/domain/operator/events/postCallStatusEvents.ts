import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallId } from "../../telephony/CallId.js";
import type { AgentStatus } from "../AgentStatus.js";
import type { BreakReason } from "../BreakReason.js";

export type PostCallStatusUpdatedEvent = ReturnType<
  typeof createPostCallStatusUpdatedEvent
>;

export function createPostCallStatusUpdatedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    postCallStatus: AgentStatus;
    reason: BreakReason | null;
    updatedAt: string;
  }>,
) {
  return createDomainEvent("PostCallStatusUpdated", correlationId, payload);
}
