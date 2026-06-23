import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type OcpNotificationLevel = "info" | "warn" | "error";

export type OcpNotificationReceivedEvent = ReturnType<
  typeof createOcpNotificationReceivedEvent
>;

/**
 * - Purpose: typed OCP toast notification from inbound sync (LF-059).
 * - Inputs: correlationId, notificationId, message, level.
 * - Outputs: OcpNotificationReceived domain event.
 */
export function createOcpNotificationReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    notificationId: string;
    message: string;
    level: OcpNotificationLevel;
  }>,
) {
  return createDomainEvent("OcpNotificationReceived", correlationId, payload);
}
