import type { OcpConnectionState } from "@application/projections/ocpConnectionRecoveryProjection.js";

export type ConnectionRecoveryReadModelSnapshot = Readonly<{
  connectionState: OcpConnectionState;
  isOcpMode: boolean;
  ocpReconnectAttempt: number | null;
}>;

export interface ConnectionRecoveryReadModel {
  getSnapshot(): ConnectionRecoveryReadModelSnapshot;
}
