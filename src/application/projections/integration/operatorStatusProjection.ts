/**
 * - Purpose: serializable operator status projection + OcpOperatorReadModel mapping.
 * - Inputs: OCP users entity payloads and local reserved-status updates.
 * - Outputs: busy/block selectors and OperatorProfile snapshots for Use Cases.
 */

import { createOperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import type { OperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import {
  OperatorStatus,
  type OperatorStatus as OperatorStatusType,
} from "@domain/integration/ocp/OperatorStatus.js";
import { isBusy as isOperatorBusy } from "@domain/integration/ocp/OperatorStatusMachine.js";
import type { OcpUsersPayload } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";

export type OperatorStatusProjection = Readonly<{
  operatorId: number | null;
  status: OperatorStatusType | null;
  reasonId: number;
  statusSince: number | null;
  isBusy: boolean;
  reservedStatus: OperatorStatusType | null;
  reservedReasonId: number | null;
}>;

export function initialOperatorStatusProjection(): OperatorStatusProjection {
  return {
    operatorId: null,
    status: null,
    reasonId: 0,
    statusSince: null,
    isBusy: false,
    reservedStatus: null,
    reservedReasonId: null,
  };
}

export function reduceOperatorStatusFromUsers(
  projection: OperatorStatusProjection,
  users: OcpUsersPayload,
): OperatorStatusProjection {
  const reasonId = normalizeReasonId(users.reasonId);
  const statusSince = parseStatusSinceMs(users.statusSince);

  return {
    ...projection,
    operatorId: users.operatorId,
    status: users.status,
    reasonId,
    statusSince,
    isBusy: isOperatorBusy(users.status),
  };
}

export function applyOperatorReservedStatus(
  projection: OperatorStatusProjection,
  reservedStatus: OperatorStatusType,
  reservedReasonId: number,
): OperatorStatusProjection {
  return {
    ...projection,
    reservedStatus,
    reservedReasonId: normalizeReasonId(reservedReasonId),
  };
}

export function clearOperatorReservedStatus(
  projection: OperatorStatusProjection,
): OperatorStatusProjection {
  return {
    ...projection,
    reservedStatus: null,
    reservedReasonId: null,
  };
}

export function selectOperatorStatus(
  projection: OperatorStatusProjection,
): OperatorStatusType | null {
  return projection.status;
}

export function selectOperatorIsBusy(projection: OperatorStatusProjection): boolean {
  return projection.isBusy;
}

export function selectIsCallButtonBlocked(
  projection: OperatorStatusProjection,
): boolean {
  return projection.status === OperatorStatus.RESERVED_TO_CALL;
}

export function toOperatorProfile(
  projection: OperatorStatusProjection,
): OperatorProfile | null {
  if (projection.operatorId === null || projection.status === null) {
    return null;
  }

  return createOperatorProfile({
    operatorId: projection.operatorId,
    status: projection.status,
    reasonId: projection.reasonId,
    statusSince:
      projection.statusSince === null
        ? new Date(0)
        : new Date(projection.statusSince),
  });
}

export function normalizeReasonId(reasonId: number | null | undefined): number {
  if (reasonId === null || reasonId === undefined) {
    return 0;
  }
  return Number.isFinite(reasonId) ? reasonId : 0;
}

function parseStatusSinceMs(statusSince: string): number | null {
  const parsed = Date.parse(statusSince);
  return Number.isFinite(parsed) ? parsed : null;
}
