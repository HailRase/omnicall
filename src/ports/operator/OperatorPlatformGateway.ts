import type {
  AgentStatus,
  OcpAuthResult,
  StatusReason,
} from "@domain/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

export type OcpAuthenticateCommand = Readonly<{
  token: string;
  domain: string;
  correlationId: CorrelationId;
}>;

export type ChangeAgentStatusCommand = Readonly<{
  targetStatus: AgentStatus;
  reason: StatusReason | null;
  correlationId: CorrelationId;
}>;

export type ChangeAgentStatusResult =
  | Readonly<{ status: "succeeded"; currentStatus: AgentStatus }>
  | Readonly<{ status: "failed"; reason: string; message: string }>;

export type GetAgentStatusCommand = Readonly<{
  correlationId: CorrelationId;
}>;

export interface OperatorPlatformGateway {
  authenticate(command: OcpAuthenticateCommand): Promise<OcpAuthResult>;
  changeAgentStatus(command: ChangeAgentStatusCommand): Promise<ChangeAgentStatusResult>;
  getAgentStatus(command: GetAgentStatusCommand): Promise<AgentStatus | null>;
}
