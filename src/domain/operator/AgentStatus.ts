/**
 * - Purpose: brand OCP operator agent status values separate from phone presence.
 * - Inputs: raw string status labels from commands or gateway payloads.
 * - Outputs: typed `AgentStatus` and validation helpers.
 */
export type AgentStatus = "ready" | "break" | "post_call";

export const AGENT_STATUSES: ReadonlyArray<AgentStatus> = [
  "ready",
  "break",
  "post_call",
];

export function isAgentStatus(value: string): value is AgentStatus {
  return AGENT_STATUSES.includes(value as AgentStatus);
}

export function agentStatusLabel(status: AgentStatus): string {
  switch (status) {
    case "ready":
      return "Готов";
    case "break":
      return "Перерыв";
    case "post_call":
      return "Постобработка";
  }
}
