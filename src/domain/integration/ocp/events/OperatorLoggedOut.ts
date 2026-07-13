/**
 * - Purpose: domain event when operator logs out with a reason.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorLoggedOutEvent = ReturnType<typeof createOperatorLoggedOutEvent>;

export function createOperatorLoggedOutEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    operatorId: number;
    reasonId: number;
    timestamp: number;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorLoggedOut",
    {
      operatorId: number;
      reasonId: number;
      featureId: typeof OCP_FEATURE_ID;
      timestamp: number;
    }
  >
> {
  return createDomainEvent("OperatorLoggedOut", correlationId, {
    operatorId: input.operatorId,
    reasonId: input.reasonId,
    featureId: OCP_FEATURE_ID,
    timestamp: input.timestamp,
  });
}
