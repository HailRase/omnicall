/**
 * - Purpose: represent multi-call policy rejections without dropping calls.
 * - Inputs: correlation id and typed rejection payload.
 * - Outputs: immutable domain event for projections and logs.
 */
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { CallId } from "../CallId.js";

export type MultiCallOperationScenario =
  | "connecting_in_progress"
  | "hold_all_in_progress"
  | "hold_all_failed"
  | "hold_all_rollback_failed"
  | "auto_answer_blocked";

export type MultiCallOperationRejectedEvent = ReturnType<
  typeof createMultiCallOperationRejectedEvent
>;

export function createMultiCallOperationRejectedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    scenario: MultiCallOperationScenario;
    reason: string;
    affectedCallIds: ReadonlyArray<CallId>;
  }>,
): ReturnType<typeof createDomainEvent<"MultiCallOperationRejected", typeof payload>> {
  return createDomainEvent("MultiCallOperationRejected", correlationId, payload);
}
