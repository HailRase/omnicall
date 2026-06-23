/**
 * - Purpose: decide when agent break status requires a configured break reason.
 * - Inputs: target status, allowed reasons list, change trigger.
 * - Outputs: boolean required flag for break reason validation.
 */
import type { AgentStatus } from "./AgentStatus.js";
import type { BreakReason } from "./BreakReason.js";

export type AgentStatusChangeTrigger = "user" | "phone_dnd";

export function isAgentBreakReasonRequired(
  targetStatus: AgentStatus,
  allowedBreakReasons: ReadonlyArray<BreakReason>,
  trigger: AgentStatusChangeTrigger,
): boolean {
  if (targetStatus !== "break") {
    return false;
  }
  if (trigger === "phone_dnd") {
    return false;
  }
  return allowedBreakReasons.length > 0;
}
