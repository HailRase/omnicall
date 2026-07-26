/**
 * - Purpose: domain signal when OCP ACD queue context resolves for a SIP call.
 * - Public SDK: maps to enriched call:* draft with optional queueLabel (no acallid).
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type CallOcpContextResolvedDirection = "incoming" | "outgoing";

export type CallOcpContextResolvedEvent = ReturnType<
  typeof createCallOcpContextResolvedEvent
>;

export function createCallOcpContextResolvedEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    callId: string;
    direction: CallOcpContextResolvedDirection;
    /** Non-empty ACD queue title; never publish this event with empty queue. */
    queueName: string;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "CallOcpContextResolved",
    {
      callId: string;
      direction: CallOcpContextResolvedDirection;
      queueName: string;
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  return createDomainEvent("CallOcpContextResolved", correlationId, {
    callId: input.callId,
    direction: input.direction,
    queueName: input.queueName,
    featureId: OCP_FEATURE_ID,
  });
}
