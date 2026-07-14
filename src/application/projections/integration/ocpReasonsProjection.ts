/**
 * - Purpose: partition OCP operator_status_reasons into Ready/Break/Logout lists.
 * - Inputs: OcpStatusReasonPayload arrays from gateway messages.
 * - Outputs: serializable reason lists for status selector UI.
 */

import { createOperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";
import type { OperatorStatusReason } from "@domain/integration/ocp/OperatorStatusReason.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";

export type OcpReasonsProjection = Readonly<{
  readyReasons: ReadonlyArray<OperatorStatusReason>;
  breakReasons: ReadonlyArray<OperatorStatusReason>;
  logoutReasons: ReadonlyArray<OperatorStatusReason>;
}>;

export function initialOcpReasonsProjection(): OcpReasonsProjection {
  return {
    readyReasons: [],
    breakReasons: [],
    logoutReasons: [],
  };
}

export function reduceOcpReasonsFromPayload(
  payload: ReadonlyArray<
    Readonly<{
      id: number;
      parentStatus: OperatorStatusReason["parentStatus"];
      defaultDescription: string;
    }>
  >,
): OcpReasonsProjection {
  const reasons = payload.map((item) =>
    createOperatorStatusReason({
      id: item.id,
      parentStatus: item.parentStatus,
      defaultDescription: item.defaultDescription,
    }),
  );

  return {
    readyReasons: reasons.filter((reason) => reason.parentStatus === OperatorStatus.READY),
    breakReasons: reasons.filter((reason) => reason.parentStatus === OperatorStatus.BREAK),
    logoutReasons: reasons.filter((reason) => reason.parentStatus === OperatorStatus.LOGOUT),
  };
}
