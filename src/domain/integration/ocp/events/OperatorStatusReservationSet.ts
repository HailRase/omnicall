/**
 * - Purpose: domain event when post-call status reservation is set while busy.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createDomainEvent } from "@domain/shared/DomainEvent.js";
import type { OperatorStatus } from "../OperatorStatus.js";
import { OCP_FEATURE_ID } from "./OperatorStatusChanged.js";

export type OperatorStatusReservationSetEvent = ReturnType<
  typeof createOperatorStatusReservationSetEvent
>;

export function createOperatorStatusReservationSetEvent(
  correlationId: CorrelationId,
  input: Readonly<{
    operatorId: number;
    reservedStatus: OperatorStatus;
    reservedReasonId: number;
  }>,
): ReturnType<
  typeof createDomainEvent<
    "OperatorStatusReservationSet",
    {
      operatorId: number;
      reservedStatus: OperatorStatus;
      reservedReasonId: number;
      featureId: typeof OCP_FEATURE_ID;
    }
  >
> {
  return createDomainEvent("OperatorStatusReservationSet", correlationId, {
    operatorId: input.operatorId,
    reservedStatus: input.reservedStatus,
    reservedReasonId: input.reservedReasonId,
    featureId: OCP_FEATURE_ID,
  });
}
