import type { ConnectionState } from "@application/projections/connectionRecoveryProjection.js";

export type ConnectionRecoveryReadModelSnapshot = Readonly<{
  connectionState: ConnectionState;
  isOcpMode: boolean;
  ocpReconnectAttempt: number | null;
  sipReconnectAttempt: number | null;
}>;

export interface ConnectionRecoveryReadModel {
  getSnapshot(): ConnectionRecoveryReadModelSnapshot;
}
