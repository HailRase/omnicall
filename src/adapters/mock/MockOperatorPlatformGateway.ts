import {
  createOperatorSessionId,
  type AgentStatus,
  type OcpAuthResult,
  type OperatorSession,
} from "@domain/index.js";
import type {
  ChangeAgentStatusCommand,
  ChangeAgentStatusResult,
  GetAgentStatusCommand,
  OcpAuthenticateCommand,
  OperatorPlatformGateway,
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

export type MockOperatorPlatformGatewayOptions = Readonly<{
  scenario?: MockOcpScenario;
  statusChangeScenario?: MockAgentStatusChangeScenario;
  initialAgentStatus?: AgentStatus;
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
  private statusChangeScenario: MockAgentStatusChangeScenario;
  private readonly initialAgentStatus: AgentStatus;
  private readonly delayMs: number;
  private readonly sipCredentials: NonNullable<
    MockOperatorPlatformGatewayOptions["sipCredentials"]
  >;

  constructor(options: MockOperatorPlatformGatewayOptions = {}) {
    this.scenario = options.scenario ?? "success";
    this.statusChangeScenario = options.statusChangeScenario ?? "success";
    this.initialAgentStatus = options.initialAgentStatus ?? "ready";
    this.delayMs = options.delayMs ?? 0;
    this.sipCredentials = options.sipCredentials ?? DEFAULT_SIP_CREDENTIALS;
  }

  setScenario(scenario: MockOcpScenario): void {
    this.scenario = scenario;
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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
