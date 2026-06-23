import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type ServerTerminatePayload = Readonly<{
  entityId: string;
  reason: string;
}>;

export type ServerTerminateReceivedEvent = ReturnType<
  typeof createServerTerminateReceivedEvent
>;

/**
 * - Purpose: record server-side forced session termination (LF-049).
 * - Inputs: correlationId, entityId, reason.
 * - Outputs: ServerTerminateReceived domain event.
 */
export function createServerTerminateReceivedEvent(
  correlationId: CorrelationId,
  payload: ServerTerminatePayload,
) {
  return createDomainEvent("ServerTerminateReceived", correlationId, payload);
}
