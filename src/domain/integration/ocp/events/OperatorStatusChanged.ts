/**
 * - Purpose: domain event when OCP operator status changes.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { OperatorStatus } from "../OperatorStatus.js";

export const OCP_FEATURE_ID = "F-028" as const;

export type OperatorStatusChangedEvent = ReturnType<
  typeof createOperatorStatusChangedEvent
>;

export function createOperatorStatusChangedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    operatorId: number;
    prevStatus: OperatorStatus;
    newStatus: OperatorStatus;
    reasonId: number;
    timestamp: number;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorStatusChanged",
    {
      operatorId: number;
      prevStatus: OperatorStatus;
      newStatus: OperatorStatus;
      reasonId: number;
      featureId: typeof OCP_FEATURE_ID;
      timestamp: number;
    }
  >
> {
  return createDomainEvent("OperatorStatusChanged", correlationId, {
    operatorId: input.operatorId,
    prevStatus: input.prevStatus,
    newStatus: input.newStatus,
    reasonId: input.reasonId,
    featureId: OCP_FEATURE_ID,
    timestamp: input.timestamp,
  });
}
