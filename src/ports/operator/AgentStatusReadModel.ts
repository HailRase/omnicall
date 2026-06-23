import type { AgentStatus } from "@domain/index.js";

export type AgentStatusReadModelSnapshot = Readonly<{
  isOcpStatusAvailable: boolean;
  currentStatus: AgentStatus | null;
  statusChangeInProgress: boolean;
}>;

export interface AgentStatusReadModel {
  getSnapshot(): AgentStatusReadModelSnapshot;
}
