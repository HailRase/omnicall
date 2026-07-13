import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type Unsubscribe = () => void;

export interface OcpGateway {
  connect(config: OcpConnectionConfig): void;
  disconnect(reason?: "logout" | "error"): void;
  sendCommand(cmd: OcpCommand): Result<void, PlatformError>;
  getConnectionState(): OcpConnectionState;
  onConnectionStateChange(handler: (state: OcpConnectionState) => void): Unsubscribe;
  onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe;
  dispose(): void;
}
