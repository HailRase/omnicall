/**
 * - Purpose: domain event when OCP operator session starts.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorSessionStartedEvent = ReturnType<
  typeof createOperatorSessionStartedEvent
>;

export function createOperatorSessionStartedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    operatorId: number;
    domain: string;
    timestamp: number;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorSessionStarted",
    {
      operatorId: number;
      domain: string;
      featureId: typeof OCP_FEATURE_ID;
      timestamp: number;
    }
  >
> {
  return createDomainEvent("OperatorSessionStarted", correlationId, {
    operatorId: input.operatorId,
    domain: input.domain,
    featureId: OCP_FEATURE_ID,
    timestamp: input.timestamp,
  });
}
