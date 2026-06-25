import type { DomainEvent } from "@domain/index.js";

/**
 * - Purpose: detect domain events that reset telephony session read models.
 * - Inputs: domain event.
 * - Outputs: whether projections should return to initial session state.
 */
export function isSessionResetEvent(event: DomainEvent): boolean {
  return event.type === "UserSessionEnded";
}
