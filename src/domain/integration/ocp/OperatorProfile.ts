/**
 * - Purpose: current OCP operator profile entity with immutable updates.
 * - Inputs: operator id, status, reason id, status timestamp.
 * - Outputs: OperatorProfile snapshots for projections and Use Cases.
 */

import type { OperatorStatus } from "./OperatorStatus.js";

export type OperatorProfile = Readonly<{
  operatorId: number;
  status: OperatorStatus;
  reasonId: number;
  statusSince: Date;
}>;

export function createOperatorProfile(input: {
  operatorId: number;
  status: OperatorStatus;
  reasonId: number;
  statusSince: Date;
}): OperatorProfile {
  return {
    operatorId: input.operatorId,
    status: input.status,
    reasonId: input.reasonId,
    statusSince: input.statusSince,
  };
}

export function withUpdatedStatus(
  profile: OperatorProfile,
  status: OperatorStatus,
  reasonId: number,
  since: Date,
): OperatorProfile {
  return {
    operatorId: profile.operatorId,
    status,
    reasonId,
    statusSince: since,
  };
}
