import {
  type AgentStatus,
  type BreakReason,
  type OcpAuthResult,
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
  OcpInboundRawHandler,
  OcpTransportDisconnectedNotification,
  OperatorPlatformGateway,
  RequestLogoutCommand,
  RequestLogoutResult,
  UpdatePostCallStatusCommand,
  UpdatePostCallStatusResult,
} from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import type { OcpWebSocketTransport } from "./OcpWebSocketTransport.js";
import {
  buildChangeStatusPayload,
  buildLogoutPayload,
  isGatewaySuccess,
  mapOcpAuthResponse,
  readAgentStatusFromRecord,
  readBreakReasonsFromRecord,
} from "./ocpWebSocketProtocol.js";

const FEATURE_ID = "F-009";

export type WebSocketOperatorPlatformGatewayOptions = Readonly<{
  transport: OcpWebSocketTransport;
  logger: Logger;
}>;

type StoredSession = Readonly<{
  token: string;
  domain: string;
}>;

/**
 * - Purpose: real OCP operator gateway over shared WebSocket transport (RAT R5).
 * - Inputs: authenticate/status/logout commands and disconnect hooks.
 * - Outputs: typed gateway results; inbound push via setInboundRawHandler.
 */
export class WebSocketOperatorPlatformGateway implements OperatorPlatformGateway {
  private readonly transport: OcpWebSocketTransport;
  private readonly logger: Logger;
  private storedSession: StoredSession | null = null;
  private cachedAgentStatus: AgentStatus | null = null;
  private cachedBreakReasons: ReadonlyArray<BreakReason> = [];
  private transportDisconnectedHandler:
    | ((notification: OcpTransportDisconnectedNotification) => Promise<void>)
    | null = null;
  private inboundRawHandler: OcpInboundRawHandler | null = null;

  constructor(options: WebSocketOperatorPlatformGatewayOptions) {
    this.transport = options.transport;
    this.logger = options.logger;

    this.transport.setDisconnectHandler((correlationId, reason) => {
      void this.notifyTransportDisconnected(correlationId, reason);
    });
  }

  setInboundRawHandler(handler: OcpInboundRawHandler | null): () => void {
    this.inboundRawHandler = handler;
    this.transport.setInboundHandler((raw, correlationId) => {
      this.inboundRawHandler?.(raw, correlationId);
    });
    return () => {
      this.inboundRawHandler = null;
      this.transport.setInboundHandler(null);
    };
  }

  setTransportDisconnectedHandler(
    handler: ((notification: OcpTransportDisconnectedNotification) => Promise<void>) | null,
  ): () => void {
    this.transportDisconnectedHandler = handler;
    return () => {
      this.transportDisconnectedHandler = null;
    };
  }

  async authenticate(command: OcpAuthenticateCommand): Promise<OcpAuthResult> {
    this.storedSession = { token: command.token, domain: command.domain };

    try {
      const response = await this.transport.request(
        "auth",
        { token: command.token, domain: command.domain },
        command.correlationId,
      );

      const result = mapOcpAuthResponse(response, command.token, command.domain);
      if (result.status === "succeeded") {
        this.cachedAgentStatus = readAgentStatusFromRecord(response);
        this.cachedBreakReasons = readBreakReasonsFromRecord(response);
      }

      this.logResult("authenticate_ocp", command.correlationId, result.status);
      return result;
    } catch (error: unknown) {
      return this.authNetworkFailure(command.correlationId, error);
    }
  }

  async getAgentStatus(command: GetAgentStatusCommand): Promise<AgentStatus | null> {
    if (this.cachedAgentStatus !== null) {
      return this.cachedAgentStatus;
    }

    try {
      const response = await this.transport.request("get_status", {}, command.correlationId);
      const status = readAgentStatusFromRecord(response);
      this.cachedAgentStatus = status;
      return status;
    } catch {
      return null;
    }
  }

  async getBreakReasons(command: GetBreakReasonsCommand): Promise<ReadonlyArray<BreakReason>> {
    if (this.cachedBreakReasons.length > 0) {
      return this.cachedBreakReasons;
    }

    try {
      const response = await this.transport.request(
        "get_break_reasons",
        {},
        command.correlationId,
      );
      this.cachedBreakReasons = readBreakReasonsFromRecord(response);
      return this.cachedBreakReasons;
    } catch {
      return [];
    }
  }

  async changeAgentStatus(
    command: ChangeAgentStatusCommand,
  ): Promise<ChangeAgentStatusResult> {
    try {
      const response = await this.transport.request(
        "change_status",
        buildChangeStatusPayload(command.targetStatus, command.reason),
        command.correlationId,
      );

      if (!isGatewaySuccess(response)) {
        return this.gatewayFailed("change_status", response);
      }

      const currentStatus = readAgentStatusFromRecord(response) ?? command.targetStatus;
      this.cachedAgentStatus = currentStatus;
      return { status: "succeeded", currentStatus };
    } catch {
      return {
        status: "failed",
        reason: "network_error",
        message: "OCP network error during status change",
      };
    }
  }

  async updatePostCallStatus(
    command: UpdatePostCallStatusCommand,
  ): Promise<UpdatePostCallStatusResult> {
    try {
      const payload: Record<string, unknown> = {
        call_id: command.callId,
        post_call_status: command.postCallStatus,
      };
      if (command.reason !== null) {
        payload["reason"] = command.reason;
      }

      const response = await this.transport.request(
        "post_call_status",
        payload,
        command.correlationId,
      );

      if (!isGatewaySuccess(response)) {
        return this.gatewayFailed("post_call_status", response);
      }

      const postCallStatus = readAgentStatusFromRecord(response) ?? command.postCallStatus;
      this.cachedAgentStatus = postCallStatus;
      return { status: "succeeded", postCallStatus };
    } catch {
      return {
        status: "failed",
        reason: "network_error",
        message: "OCP network error during post-call update",
      };
    }
  }

  async requestLogout(command: RequestLogoutCommand): Promise<RequestLogoutResult> {
    try {
      const response = await this.transport.request(
        "logout",
        buildLogoutPayload(command.reason),
        command.correlationId,
      );

      if (!isGatewaySuccess(response)) {
        return this.gatewayFailed("logout", response);
      }

      return { status: "succeeded" };
    } catch {
      return {
        status: "failed",
        reason: "network_error",
        message: "OCP network error during logout",
      };
    }
  }

  async reconnectTransport(correlationId: CorrelationId): Promise<Result<void, PlatformError>> {
    if (this.storedSession === null) {
      return err(
        createPlatformError("operation_failed", "OCP transport reconnect failed: no session"),
      );
    }

    try {
      const authResult = await this.authenticate({
        token: this.storedSession.token,
        domain: this.storedSession.domain,
        correlationId,
      });

      if (authResult.status === "failed") {
        return err(createPlatformError("operation_failed", authResult.message));
      }

      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "OCP reconnect failed";
      return err(createPlatformError("operation_failed", message));
    }
  }

  private authNetworkFailure(
    correlationId: CorrelationId,
    error: unknown,
  ): OcpAuthResult {
    this.logger.error(
      "ocp_authentication_failed",
      {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Operator",
        operation: "authenticate_ocp",
        result: "network_error",
      },
      error,
    );

    return {
      status: "failed",
      reason: "network_error",
      message: "OCP network error",
    };
  }

  private gatewayFailed(
    operation: string,
    response: Record<string, unknown>,
  ): Readonly<{ status: "failed"; reason: string; message: string }> {
    const message =
      typeof response["message"] === "string"
        ? response["message"]
        : `OCP rejected ${operation}`;
    return {
      status: "failed",
      reason: "gateway_failed",
      message,
    };
  }

  private async notifyTransportDisconnected(
    correlationId: CorrelationId,
    reason: string,
  ): Promise<void> {
    if (this.transportDisconnectedHandler === null) {
      return;
    }

    await this.transportDisconnectedHandler({ correlationId, reason });
  }

  private logResult(
    operation: string,
    correlationId: CorrelationId,
    result: string,
  ): void {
    this.logger.info(operation, {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation,
      result,
    });
  }
}
