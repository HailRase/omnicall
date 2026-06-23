/**
 * - Purpose: map phone DND presence to agent break request contract (LF-018).
 * - Inputs: phone status, current agent status, OCP availability flag.
 * - Outputs: break request action or no-op when mapping does not apply.
 */
import type { PhoneStatus } from "../shared/PhoneStatus.js";
import type { AgentStatus } from "./AgentStatus.js";

export type DndAgentStatusAction =
  | Readonly<{ action: "request_break"; trigger: "phone_dnd" }>
  | Readonly<{ action: "none" }>;

export function mapDndToAgentBreakRequest(
  phoneStatus: PhoneStatus,
  currentAgentStatus: AgentStatus | null,
  isOcpStatusAvailable: boolean,
): DndAgentStatusAction {
  if (!isOcpStatusAvailable) {
    return { action: "none" };
  }

  if (phoneStatus !== "dnd") {
    return { action: "none" };
  }

  if (currentAgentStatus === "break") {
    return { action: "none" };
  }

  return { action: "request_break", trigger: "phone_dnd" };
}

export function isReadyBlockedByDnd(phoneStatus: PhoneStatus): boolean {
  return phoneStatus === "dnd";
}
