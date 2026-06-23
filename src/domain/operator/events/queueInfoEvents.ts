import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { CallId } from "../../telephony/CallId.js";
import type { MainAcallId } from "../ocp/MainAcallId.js";

export type QueueInfoReceivedEvent = ReturnType<typeof createQueueInfoReceivedEvent>;

export function createQueueInfoReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    callId: CallId;
    mainAcallId: MainAcallId;
    queueName: string;
  }>,
) {
  return createDomainEvent("QueueInfoReceived", correlationId, payload);
}

export type QueueInfoDomainEvent = QueueInfoReceivedEvent;
