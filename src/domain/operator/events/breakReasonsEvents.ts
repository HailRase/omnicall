import { createDomainEvent } from "../../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { BreakReason } from "../BreakReason.js";

export type BreakReasonsReceivedEvent = ReturnType<
  typeof createBreakReasonsReceivedEvent
>;

export function createBreakReasonsReceivedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{ reasons: ReadonlyArray<BreakReason> }>,
) {
  return createDomainEvent("BreakReasonsReceived", correlationId, payload);
}
