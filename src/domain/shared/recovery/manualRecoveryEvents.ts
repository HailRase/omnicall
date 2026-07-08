import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type ManualReconnectChannel = "sip";

export type ManualReconnectRequestedEvent = ReturnType<
  typeof createManualReconnectRequestedEvent
>;

/**
 * - Purpose: record user-initiated reconnect after terminal or manual-retry state (LF-009, LF-010).
 * - Inputs: correlationId, affected channel.
 * - Outputs: ManualReconnectRequested domain event.
 */
export function createManualReconnectRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    channel: ManualReconnectChannel;
  }>,
) {
  return createDomainEvent("ManualReconnectRequested", correlationId, payload);
}
