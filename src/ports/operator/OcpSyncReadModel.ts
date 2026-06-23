/**
 * - Purpose: OCP sync availability snapshot for inbound message Use Cases.
 * - Inputs: event-sourced updates from authentication and startup events.
 * - Outputs: isOcpSyncAvailable flag for SIP-only no-op gating.
 */
export type OcpSyncReadModelSnapshot = Readonly<{
  isOcpSyncAvailable: boolean;
}>;

export interface OcpSyncReadModel {
  getSnapshot(): OcpSyncReadModelSnapshot;
}
