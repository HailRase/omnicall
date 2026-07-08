import type { DomainEvent } from "@domain/index.js";

export const TRANSFER_SUCCESS_CELEBRATION_TTL_MS = 2500;

/**
 * - Purpose: detect domain events that should trigger transfer success celebration UI.
 * - Inputs: domain event from telephony transfer completion.
 * - Outputs: true for blind or attended transfer success events.
 */
export function isTransferSuccessCelebrationEvent(event: DomainEvent): boolean {
  return event.type === "CallTransferred" || event.type === "AttendedTransferCompleted";
}
