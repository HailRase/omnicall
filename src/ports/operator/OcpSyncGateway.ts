import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";

/**
 * - Purpose: parse inbound OCP sync WebSocket messages at adapter boundary.
 * - Inputs: raw unknown payload from transport.
 * - Outputs: typed OcpInboundMessage or null when unparsable.
 */
export interface OcpSyncGateway {
  parseInboundMessage(raw: unknown): OcpInboundMessage | null;
}
