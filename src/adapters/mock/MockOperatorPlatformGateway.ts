import {
  createOperatorSessionId,
  createBreakReason,
  type AgentStatus,
  type BreakReason,
  type OcpAuthResult,
  type OperatorSession,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type {
  ChangeAgentStatusCommand,
  ChangeAgentStatusResult,
  GetAgentStatusCommand,
  GetBreakReasonsCommand,
  OcpAuthenticateCommand,
  OperatorPlatformGateway,
  OcpTransportDisconnectedNotification,
  UpdatePostCallStatusCommand,
  UpdatePostCallStatusResult,
  RequestLogoutCommand,
  RequestLogoutResult,
} from "@ports/index.js";

export type MockOcpScenario =
  | "success"
  | "session_exists"
  | "invalid_token"
  | "access_denied"
  | "network_error";

export type MockAgentStatusChangeScenario =
  | "success"
  | "rejected"
  | "network_error";

export type MockLogoutScenario = "success" | "rejected" | "network_error";

export type MockOcpReconnectScenario = "success" | "failure";

export type MockOperatorPlatformGatewayOptions = Readonly<{
  scenario?: MockOcpScenario;
  reconnectScenario?: MockOcpReconnectScenario;
  statusChangeScenario?: MockAgentStatusChangeScenario;
  initialAgentStatus?: AgentStatus;
  breakReasons?: ReadonlyArray<string>;
  postCallStatusScenario?: MockAgentStatusChangeScenario;
  logoutScenario?: MockLogoutScenario;
  delayMs?: number;
  sipCredentials?: Readonly<{
    uri: string;
    username: string;
    password: string;
    displayName: string;
    registrar: string;
  }>;
}>;

const DEFAULT_SIP_CREDENTIALS = {
  uri: "sip:agent@pbx.example",
  username: "agent",
  password: "secret",
  displayName: "Agent",
  registrar: "sip:pbx.example",
} as const;

export class MockOperatorPlatformGateway implements OperatorPlatformGateway {
  private scenario: MockOcpScenario;
  private reconnectScenario: MockOcpReconnectScenario;
  private statusChangeScenario: MockAgentStatusChangeScenario;
  private postCallStatusScenario: MockAgentStatusChangeScenario;
  private logoutScenario: MockLogoutScenario;
  private readonly initialAgentStatus: AgentStatus;
  private readonly breakReasons: ReadonlyArray<BreakReason>;
  private readonly delayMs: number;
  private readonly sipCredentials: NonNullable<
    MockOperatorPlatformGatewayOptions["sipCredentials"]
  >;
  private transportDisconnectedHandler:
    | ((notification: OcpTransportDisconnectedNotification) => Promise<void>)
    | null = null;

  constructor(options: MockOperatorPlatformGatewayOptions = {}) {
    this.scenario = options.scenario ?? "success";
    this.reconnectScenario = options.reconnectScenario ?? "success";
    this.statusChangeScenario = options.statusChangeScenario ?? "success";
    this.postCallStatusScenario = options.postCallStatusScenario ?? "success";
    this.logoutScenario = options.logoutScenario ?? "success";
    this.initialAgentStatus = options.initialAgentStatus ?? "ready";
    this.breakReasons = (options.breakReasons ?? ["break", "meeting", "training"]).map(
      (reason) => createBreakReason(reason),
    );
    this.delayMs = options.delayMs ?? 0;
    this.sipCredentials = options.sipCredentials ?? DEFAULT_SIP_CREDENTIALS;
  }

  setScenario(scenario: MockOcpScenario): void {
    this.scenario = scenario;
  }

  setReconnectScenario(scenario: MockOcpReconnectScenario): void {
    this.reconnectScenario = scenario;
  }

  setStatusChangeScenario(scenario: MockAgentStatusChangeScenario): void {
    this.statusChangeScenario = scenario;
  }

  async authenticate(command: OcpAuthenticateCommand): Promise<OcpAuthResult> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    switch (this.scenario) {
      case "success": {
        const session: OperatorSession = {
          id: createOperatorSessionId(`session-${command.token}`),
          token: command.token,
          domain: command.domain,
          agentId: "agent-001",
        };

        return {
          status: "succeeded",
          session,
          sipCredentials: {
            uri: this.sipCredentials.uri,
            username: this.sipCredentials.username,
            password: this.sipCredentials.password,
            displayName: this.sipCredentials.displayName,
            registrar: this.sipCredentials.registrar,
          },
        };
      }
      case "session_exists":
        return {
          status: "failed",
          reason: "session_exists",
          message: "OCP session already exists",
        };
      case "invalid_token":
        return {
          status: "failed",
          reason: "invalid_token",
          message: "Invalid OCP token",
        };
      case "access_denied":
        return {
          status: "failed",
          reason: "access_denied",
          message: "Access denied: username is required",
        };
      case "network_error":
        return {
          status: "failed",
          reason: "network_error",
          message: "OCP network error",
        };
    }
  }

  async getAgentStatus(command: GetAgentStatusCommand): Promise<AgentStatus | null> {
    void command;
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.scenario !== "success") {
      return null;
    }

    return this.initialAgentStatus;
  }

  async getBreakReasons(command: GetBreakReasonsCommand): Promise<ReadonlyArray<BreakReason>> {
    void command;
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.scenario !== "success") {
      return [];
    }

    return this.breakReasons;
  }

  async updatePostCallStatus(
    command: UpdatePostCallStatusCommand,
  ): Promise<UpdatePostCallStatusResult> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    switch (this.postCallStatusScenario) {
      case "success":
        return {
          status: "succeeded",
          postCallStatus: command.postCallStatus,
        };
      case "rejected":
        return {
          status: "failed",
          reason: "gateway_failed",
          message: "OCP rejected post-call status update",
        };
      case "network_error":
        return {
          status: "failed",
          reason: "network_error",
          message: "OCP network error during post-call update",
        };
    }
  }

  async changeAgentStatus(
    command: ChangeAgentStatusCommand,
  ): Promise<ChangeAgentStatusResult> {
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    switch (this.statusChangeScenario) {
      case "success":
        return {
          status: "succeeded",
          currentStatus: command.targetStatus,
        };
      case "rejected":
        return {
          status: "failed",
          reason: "gateway_failed",
          message: "OCP rejected status change",
        };
      case "network_error":
        return {
          status: "failed",
          reason: "network_error",
          message: "OCP network error during status change",
        };
    }
  }

  async requestLogout(command: RequestLogoutCommand): Promise<RequestLogoutResult> {
    void command;
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    switch (this.logoutScenario) {
      case "success":
        return { status: "succeeded" };
      case "rejected":
        return {
          status: "failed",
          reason: "gateway_failed",
          message: "OCP rejected logout request",
        };
      case "network_error":
        return {
          status: "failed",
          reason: "network_error",
          message: "OCP network error during logout",
        };
    }
  }

  /** P08 WU2: OCP WebSocket disconnect hook for recovery orchestration. */
  setTransportDisconnectedHandler(
    handler: ((notification: OcpTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void {
    this.transportDisconnectedHandler = handler;
    return () => {
      this.transportDisconnectedHandler = null;
    };
  }

  async reconnectTransport(correlationId: CorrelationId): Promise<Result<void, PlatformError>> {
    void correlationId;
    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    if (this.reconnectScenario === "failure") {
      return err(
        createPlatformError("operation_failed", "OCP transport reconnect failed"),
      );
    }

    return ok(undefined);
  }

  async simulateOcpTransportDisconnected(
    notification: OcpTransportDisconnectedNotification,
  ): Promise<void> {
    if (this.transportDisconnectedHandler !== null) {
      await this.transportDisconnectedHandler(notification);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
