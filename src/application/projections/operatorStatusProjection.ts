import type { DomainEvent } from "@domain/index.js";
import type { AgentStatus } from "@domain/operator/AgentStatus.js";
import type { AgentStatusRejectionReason } from "@domain/operator/AgentStatusTransition.js";
import type { StatusReason } from "@domain/operator/StatusReason.js";
import { isAgentStatusRejectionReason } from "@domain/operator/AgentStatusTransition.js";
import { parseOptionalStatusReason } from "@domain/operator/StatusReason.js";
import { isAgentStatus } from "@domain/operator/AgentStatus.js";

export type OperatorStatusDisabledReason =
  | "ocp_not_connected"
  | "invalid_transition"
  | "dnd_blocks_ready"
  | "status_change_in_progress"
  | "break_reason_required";

export type OperatorStatusProjection = Readonly<{
  isOcpStatusAvailable: boolean;
  currentStatus: AgentStatus | null;
  pendingStatus: AgentStatus | null;
  lastRejectionReason: AgentStatusRejectionReason | null;
  statusChangeInProgress: boolean;
  currentBreakReason: StatusReason | null;
  statusChangedAt: string | null;
}>;

export const initialOperatorStatusProjection = (): OperatorStatusProjection => ({
  isOcpStatusAvailable: false,
  currentStatus: null,
  pendingStatus: null,
  lastRejectionReason: null,
  statusChangeInProgress: false,
  currentBreakReason: null,
  statusChangedAt: null,
});

function applyOcpAvailabilityEvent(
  projection: OperatorStatusProjection,
  event: DomainEvent,
): OperatorStatusProjection {
  switch (event.type) {
    case "StartupModeResolved": {
      const resolution = event["resolution"];
      if (
        resolution !== undefined &&
        typeof resolution === "object" &&
        resolution !== null &&
        "action" in resolution &&
        resolution.action === "sip_only_ready"
      ) {
        return {
          ...projection,
          isOcpStatusAvailable: false,
          currentStatus: null,
          pendingStatus: null,
          statusChangeInProgress: false,
          lastRejectionReason: null,
        };
      }
      return projection;
    }
    case "OcpAuthenticationSucceeded":
      return {
        ...projection,
        isOcpStatusAvailable: true,
        lastRejectionReason: null,
      };
    case "OcpAuthenticationFailed":
      return {
        ...projection,
        isOcpStatusAvailable: false,
        pendingStatus: null,
        statusChangeInProgress: false,
      };
    default:
      return projection;
  }
}

function applyAgentStatusEvent(
  projection: OperatorStatusProjection,
  event: DomainEvent,
): OperatorStatusProjection {
  switch (event.type) {
    case "AgentStatusChangeRequested": {
      const targetStatus = event["targetStatus"];
      if (typeof targetStatus !== "string" || !isAgentStatus(targetStatus)) {
        return projection;
      }
      return {
        ...projection,
        pendingStatus: targetStatus,
        statusChangeInProgress: true,
        lastRejectionReason: null,
      };
    }
    case "AgentStatusChanged": {
      const currentStatus = event["currentStatus"];
      const changedAt = event["changedAt"];
      const reason = event["reason"];
      if (typeof currentStatus !== "string" || !isAgentStatus(currentStatus)) {
        return projection;
      }
      if (typeof changedAt !== "string") {
        return projection;
      }
      const breakReason =
        currentStatus === "break" ? parseOptionalStatusReason(reason) : null;
      return {
        ...projection,
        currentStatus,
        pendingStatus: null,
        statusChangeInProgress: false,
        lastRejectionReason: null,
        currentBreakReason: breakReason,
        statusChangedAt: changedAt,
      };
    }
    case "AgentStatusChangeRejected": {
      const rejectionReason = event["reason"];
      if (!isAgentStatusRejectionReason(rejectionReason)) {
        return projection;
      }
      return {
        ...projection,
        pendingStatus: null,
        statusChangeInProgress: false,
        lastRejectionReason: rejectionReason,
      };
    }
    default:
      return projection;
  }
}

export function reduceOperatorStatusProjection(
  projection: OperatorStatusProjection,
  event: DomainEvent,
): OperatorStatusProjection {
  const afterAvailability = applyOcpAvailabilityEvent(projection, event);
  return applyAgentStatusEvent(afterAvailability, event);
}
