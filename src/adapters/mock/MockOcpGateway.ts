/**
 * - Purpose: in-memory OcpGateway for Use Case and bridge tests without WebSocket.
 * - Inputs: connect/disconnect/sendCommand and simulation helpers.
 * - Outputs: traceable commands and synthetic incoming messages.
 */

import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpGateway, Unsubscribe } from "@ports/integration/OcpGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export class MockOcpGateway implements OcpGateway {
  private connectionState: OcpConnectionState = "disconnected";
  private readonly sentCommands: OcpCommand[] = [];
  private readonly messageHandlers = new Set<(msg: OcpIncomingMessage) => void>();
  private readonly stateHandlers = new Set<(state: OcpConnectionState) => void>();
  private connected = false;

  connect(config: OcpConnectionConfig): void {
    void config;
    this.connected = true;
    this.setConnectionState("connecting");
    this.setConnectionState("connected");
  }

  disconnect(reason?: "logout" | "error" | "terminate"): void {
    this.connected = false;
    if (reason === "error") {
      this.setConnectionState("failed");
      return;
    }
    if (reason === "terminate") {
      this.setConnectionState("sessionClosed");
      return;
    }
    this.setConnectionState("disconnected");
  }

  sendCommand(cmd: OcpCommand): Result<void, PlatformError> {
    if (!this.connected) {
      return err(
        createPlatformError("operation_failed", "ocp_mock_not_connected"),
      );
    }
    this.sentCommands.push(cmd);
    return ok(undefined);
  }

  getConnectionState(): OcpConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(handler: (state: OcpConnectionState) => void): Unsubscribe {
    this.stateHandlers.add(handler);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  onMessage(handler: (msg: OcpIncomingMessage) => void): Unsubscribe {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  dispose(): void {
    this.connected = false;
    this.messageHandlers.clear();
    this.stateHandlers.clear();
    this.setConnectionState("disconnected");
  }

  simulateMessage(msg: OcpIncomingMessage): void {
    if (msg.entity === "users" && this.connectionState !== "authenticated") {
      this.setConnectionState("authenticated");
    }
    if (msg.entity === "Error") {
      if (msg.data.code === "SESSION_EXIST" || msg.data.code === "INVALID_TOKEN") {
        this.connected = false;
        this.setConnectionState("sessionClosed");
      }
    }
    for (const handler of this.messageHandlers) {
      handler(msg);
    }
  }

  simulateDisconnect(): void {
    this.connected = false;
    this.setConnectionState("disconnected");
  }

  simulateAuthSuccess(operatorId: number): void {
    this.simulateMessage({
      entity: "users",
      data: {
        operatorId,
        status: OperatorStatus.READY,
        reasonId: 0,
        statusSince: new Date().toISOString(),
      },
    });
  }

  getSentCommands(): ReadonlyArray<OcpCommand> {
    return this.sentCommands;
  }

  getLastSentCommand(): OcpCommand | undefined {
    return this.sentCommands.at(-1);
  }

  clearSentCommands(): void {
    this.sentCommands.length = 0;
  }

  private setConnectionState(nextState: OcpConnectionState): void {
    if (this.connectionState === nextState) {
      return;
    }
    this.connectionState = nextState;
    for (const handler of this.stateHandlers) {
      handler(nextState);
    }
  }
}
