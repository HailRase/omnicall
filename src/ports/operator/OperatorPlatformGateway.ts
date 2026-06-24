import type {
  AgentStatus,
  BreakReason,
  OcpAuthResult,
  StatusReason,
} from "@domain/index.js";
import type { CallId } from "@domain/telephony/CallId.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

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

export type GetBreakReasonsCommand = Readonly<{
  correlationId: CorrelationId;
}>;

export type UpdatePostCallStatusCommand = Readonly<{
  callId: CallId;
  postCallStatus: AgentStatus;
  reason: BreakReason | null;
  correlationId: CorrelationId;
}>;

export type UpdatePostCallStatusResult =
  | Readonly<{ status: "succeeded"; postCallStatus: AgentStatus }>
  | Readonly<{ status: "failed"; reason: string; message: string }>;

export type RequestLogoutCommand = Readonly<{
  reason: StatusReason | null;
  correlationId: CorrelationId;
}>;

export type RequestLogoutResult =
  | Readonly<{ status: "succeeded" }>
  | Readonly<{ status: "failed"; reason: string; message: string }>;

export type OcpTransportDisconnectedNotification = Readonly<{
  correlationId: CorrelationId;
  reason: string;
}>;

export type OcpInboundRawHandler = (
  raw: unknown,
  correlationId: CorrelationId,
) => void;

export interface OperatorPlatformGateway {
  authenticate(command: OcpAuthenticateCommand): Promise<OcpAuthResult>;
  changeAgentStatus(command: ChangeAgentStatusCommand): Promise<ChangeAgentStatusResult>;
  getAgentStatus(command: GetAgentStatusCommand): Promise<AgentStatus | null>;
  getBreakReasons(command: GetBreakReasonsCommand): Promise<ReadonlyArray<BreakReason>>;
  updatePostCallStatus(
    command: UpdatePostCallStatusCommand,
  ): Promise<UpdatePostCallStatusResult>;
  requestLogout(command: RequestLogoutCommand): Promise<RequestLogoutResult>;
  /** WU2: adapter invokes on OCP WebSocket disconnect (LF-057, LF-058). */
  setTransportDisconnectedHandler(
    handler: ((notification: OcpTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void;
  /**
   * Re-establish OCP WebSocket after disconnect (LF-058).
   * Real adapter restores session; mock maps to reconnectScenario.
   */
  reconnectTransport(correlationId: CorrelationId): Promise<Result<void, PlatformError>>;
  /**
   * RAT R5: deliver unsolicited OCP inbound payloads to ProcessOcpInboundMessageUseCase.
   * Wired in bootstrap factories, not AccountBootstrapFacade.
   */
  setInboundRawHandler(handler: OcpInboundRawHandler | null): () => void;
}
