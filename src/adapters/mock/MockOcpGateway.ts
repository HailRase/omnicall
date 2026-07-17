/**
 * - Purpose: in-memory OcpGateway for Use Case and bridge tests without WebSocket.
 * - Inputs: connect/disconnect/sendCommand and simulation helpers.
 * - Outputs: transport-only states + traceable commands (ADR-AF-002).
 */

import type { OcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type {
  OcpGateway,
  OcpGatewayMessageEnvelope,
  Unsubscribe,
} from "@ports/integration/OcpGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export class MockOcpGateway implements OcpGateway {
  private connectionState: OcpServerState = "disconnected";
  private readonly sentCommands: OcpCommand[] = [];
  private readonly messageHandlers = new Set<(msg: OcpIncomingMessage) => void>();
  private readonly envelopeHandlers = new Set<
    (envelope: OcpGatewayMessageEnvelope) => void
  >();
  private readonly stateHandlers = new Set<(state: OcpServerState) => void>();
  private connected = false;
  private socketGeneration = 0;

  connect(config: OcpConnectionConfig): void {
    void config;
    this.connected = true;
    this.socketGeneration += 1;
    this.setConnectionState("connecting");
    this.setConnectionState("connected");
  }

  disconnect(reason?: "logout" | "error" | "terminate"): void {
    this.connected = false;
    if (reason === "error") {
      this.setConnectionState("failed");
      return;
    }
    this.setConnectionState("disconnected");
  }

  sendCommand(cmd: OcpCommand): Result<void, PlatformError> {
    if (!this.connected || this.connectionState !== "connected") {
      return err(
        createPlatformError("operation_failed", "ocp_mock_not_connected"),
      );
    }
    this.sentCommands.push(cmd);
    return ok(undefined);
  }

  getConnectionState(): OcpServerState {
    return this.connectionState;
  }

  /** Test helper: distinct socket identity for one-socket invariant proofs. */
  getSocketGeneration(): number {
    return this.socketGeneration;
  }

  onConnectionStateChange(handler: (state: OcpServerState) => void): Unsubscribe {
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

  onMessageEnvelope(
    handler: (envelope: OcpGatewayMessageEnvelope) => void,
  ): Unsubscribe {
    this.envelopeHandlers.add(handler);
    return () => {
      this.envelopeHandlers.delete(handler);
    };
  }

  getSocketEpoch(): number {
    return this.socketGeneration;
  }

  dispose(): void {
    this.connected = false;
    this.messageHandlers.clear();
    this.envelopeHandlers.clear();
    this.stateHandlers.clear();
    this.setConnectionState("disconnected");
  }

  simulateMessage(msg: OcpIncomingMessage): void {
    if (msg.entity === "Error") {
      if (
        msg.data.code === "SESSION_EXIST" ||
        msg.data.code === "INVALID_TOKEN"
      ) {
        for (const handler of this.messageHandlers) {
          handler(msg);
        }
        this.dispatchEnvelope(msg, this.socketGeneration);
        this.connected = false;
        this.setConnectionState("failed");
        return;
      }
    }
    for (const handler of this.messageHandlers) {
      handler(msg);
    }
    this.dispatchEnvelope(msg, this.socketGeneration);
  }

  simulateStaleMessage(msg: OcpIncomingMessage, socketEpoch: number): void {
    this.dispatchEnvelope(msg, socketEpoch);
  }

  simulateDisconnect(): void {
    this.connected = false;
    this.setConnectionState("failed");
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

  /**
   * - Purpose: push SIP credentials entity after OCP auth (test helper).
   * - Inputs: username/domain/server (+ password never asserted in logs).
   */
  simulateSipCredentials(
    input: Readonly<{
      username: string;
      password?: string;
      domain: string;
      server: string;
    }>,
  ): void {
    this.simulateMessage({
      entity: "creds",
      data: {
        username: input.username,
        password: input.password ?? "test-sip-password",
        domain: input.domain,
        server: input.server,
      },
    });
  }

  /** Auth success + SIP credentials in one step for OCP→SIP orchestration tests. */
  simulateAuthSuccessWithCredentials(
    operatorId: number,
    credentials: Readonly<{
      username: string;
      password?: string;
      domain: string;
      server: string;
    }>,
  ): void {
    this.simulateAuthSuccess(operatorId);
    this.simulateSipCredentials(credentials);
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

  private dispatchEnvelope(
    message: OcpIncomingMessage,
    socketEpoch: number,
  ): void {
    for (const handler of this.envelopeHandlers) {
      handler({ socketEpoch, message });
    }
  }

  private setConnectionState(nextState: OcpServerState): void {
    if (this.connectionState === nextState) {
      return;
    }
    this.connectionState = nextState;
    for (const handler of this.stateHandlers) {
      handler(nextState);
    }
  }
}
