/**
 * - Purpose: validate agent status transitions and DND constraints (LF-045, LF-019).
 * - Inputs: current/target status, phone presence, optional break reason context.
 * - Outputs: allowed transition or typed rejection reason.
 */
import type { PhoneStatus } from "../shared/PhoneStatus.js";
import type { AgentStatus } from "./AgentStatus.js";
import type { StatusReason } from "./StatusReason.js";

export type AgentStatusRejectionReason =
  | "invalid_transition"
  | "dnd_blocks_ready"
  | "break_reason_required"
  | "already_in_status"
  | "gateway_failed"
  | "ocp_not_connected"
  | "network_error";

export const AGENT_STATUS_REJECTION_REASONS: ReadonlyArray<AgentStatusRejectionReason> =
  [
    "invalid_transition",
    "dnd_blocks_ready",
    "break_reason_required",
    "already_in_status",
    "gateway_failed",
    "ocp_not_connected",
    "network_error",
  ];

export function isAgentStatusRejectionReason(
  value: unknown,
): value is AgentStatusRejectionReason {
  return (
    typeof value === "string" &&
    AGENT_STATUS_REJECTION_REASONS.includes(value as AgentStatusRejectionReason)
  );
}

export type AgentStatusTransitionContext = Readonly<{
  phoneStatus: PhoneStatus;
  breakReasonRequired: boolean;
  reason: StatusReason | null;
}>;

export type AgentStatusTransitionResult =
  | Readonly<{ ok: true; targetStatus: AgentStatus }>
  | Readonly<{
      ok: false;
      reason: AgentStatusRejectionReason;
      currentStatus: AgentStatus;
    }>;

const ALLOWED_TRANSITIONS: Readonly<
  Record<AgentStatus, ReadonlyArray<AgentStatus>>
> = {
  ready: ["break"],
  break: ["ready", "post_call"],
  post_call: ["ready", "break"],
};

export function getAllowedAgentStatusTransitions(
  current: AgentStatus,
): ReadonlyArray<AgentStatus> {
  return ALLOWED_TRANSITIONS[current];
}

export function validateAgentStatusTransition(
  current: AgentStatus,
  target: AgentStatus,
  context: AgentStatusTransitionContext,
): AgentStatusTransitionResult {
  if (current === target) {
    return { ok: false, reason: "already_in_status", currentStatus: current };
  }

  if (!ALLOWED_TRANSITIONS[current].includes(target)) {
    return { ok: false, reason: "invalid_transition", currentStatus: current };
  }

  if (target === "ready" && context.phoneStatus === "dnd") {
    return { ok: false, reason: "dnd_blocks_ready", currentStatus: current };
  }

  if (
    target === "break" &&
    context.breakReasonRequired &&
    context.reason === null
  ) {
    return { ok: false, reason: "break_reason_required", currentStatus: current };
  }

  return { ok: true, targetStatus: target };
}
