/**
 * - Purpose: signal that OCP credentials arrived (no password in event payload).
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorCredentialsReceivedEvent = ReturnType<
  typeof createOperatorCredentialsReceivedEvent
>;

export function createOperatorCredentialsReceivedEvent(
  correlationId: CorrelationId,
): ReturnType<
  typeof createDomainEvent<
    "OperatorCredentialsReceived",
    {
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  return createDomainEvent("OperatorCredentialsReceived", correlationId, {
    featureId: OCP_FEATURE_ID,
  });
}
