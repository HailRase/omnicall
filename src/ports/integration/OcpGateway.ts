import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type Unsubscribe = () => void;

/** Gateway close reasons — Application maps terminate to dual-FSM terminal projection. */
export type OcpDisconnectReason = "logout" | "error" | "terminate";
export type OcpGatewayMessageEnvelope = Readonly<{
  socketEpoch: number;
  message: OcpIncomingMessage;
}>;

/**
 * Transport-only OCP boundary (ADR-AF-002).
 * Emits server/transport states only — never authorization outcomes.
 * Does not schedule reconnect with a retained ephemeral token.
 */
export interface OcpGateway {
  connect(config: OcpConnectionConfig): void;
  disconnect(reason?: OcpDisconnectReason): void;
  sendCommand(cmd: OcpCommand): Result<void, PlatformError>;
  getConnectionState(): OcpServerState;
  onConnectionStateChange(handler: (state: OcpServerState) => void): Unsubscribe;
  onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe;
  onMessageEnvelope?(
    handler: (envelope: OcpGatewayMessageEnvelope) => void,
  ): Unsubscribe;
  getSocketEpoch?(): number;
  dispose(): void;
}
