import { createDomainEvent } from "../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type UserSessionEndedEvent = ReturnType<typeof createUserSessionEndedEvent>;

/**
 * - Purpose: signal ordered SIP user session teardown completed (LF-079, LF-048 SIP).
 * - Inputs: correlationId.
 * - Outputs: UserSessionEnded domain event for projection reset.
 */
export function createUserSessionEndedEvent(correlationId: CorrelationId) {
  return createDomainEvent("UserSessionEnded", correlationId, {});
}
