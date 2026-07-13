/**
 * - Purpose: domain event when OCP operator session ends.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorSessionEndReason = "logout" | "terminate" | "error";

export type OperatorSessionEndedEvent = ReturnType<
  typeof createOperatorSessionEndedEvent
>;

export function createOperatorSessionEndedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    operatorId: number;
    reason: OperatorSessionEndReason;
    timestamp: number;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorSessionEnded",
    {
      operatorId: number;
      reason: OperatorSessionEndReason;
      featureId: typeof OCP_FEATURE_ID;
      timestamp: number;
    }
  >
> {
  return createDomainEvent("OperatorSessionEnded", correlationId, {
    operatorId: input.operatorId,
    reason: input.reason,
    featureId: OCP_FEATURE_ID,
    timestamp: input.timestamp,
  });
}
