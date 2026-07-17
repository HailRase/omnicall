/**
 * - Purpose: HTTP authenticate → fresh-token WS connect → Application-owned auth send.
 * - Inputs: domain, login, apiKey; ports for HTTP + ConnectOcp + session projection hub.
 * - Outputs: success, SESSION_EXIST feedback, AUTH_TIMEOUT, or PlatformError (token never persisted).
 *
 * ADR-AF-002: Application sends auth after transport connected; auth-only retry reuses socket.
 */

import type { Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpProxyAuthenticatePort } from "@ports/integration/OcpProxyAuthenticatePort.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import type { ConnectOcpUseCase } from "../../use-cases/integration/ocp/ConnectOcpUseCase.js";
import type { DisconnectOcpUseCase } from "../../use-cases/integration/ocp/DisconnectOcpUseCase.js";
import { OcpAttemptTokenScope } from "./OcpAttemptTokenScope.js";
import {
  OCP_SIGN_IN_STAGE_TIMEOUT_MS,
  type OcpSignInExecutionStage,
} from "@domain/index.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

/** Wait for OCP authorization after WS connect + auth send before surfacing timeout toast. */
export const OCP_AUTH_SESSION_TIMEOUT_MS = 15_000;

export type OcpAuthenticateAndConnectInput = Readonly<{
  domain: string;
  login: string;
  apiKey: string;
  correlationId?: CorrelationId;
}>;

export type OcpAuthenticateAndConnectDeps = Readonly<{
  proxyAuthenticate: OcpProxyAuthenticatePort;
  connectOcp: ConnectOcpUseCase;
  disconnectOcp: DisconnectOcpUseCase;
  ocpGateway: OcpGateway;
  projectionHub: OcpProjectionHub;
  logger: Logger;
  sessionTimeoutMs?: number;
  tokenScope?: OcpAttemptTokenScope;
  /**
   * Disarm Application transport recovery immediately before intentional close.
   * Required because beginAttempt notifies hub subscribers that may re-arm wasLive
   * while authorization is still "authorized" from the previous session.
   */
  cancelTransportRecovery?: (reason: string) => void;
  onExecutionStage?: (
    stage: OcpSignInExecutionStage,
    correlationId: CorrelationId,
  ) => void;
}>;

export class OcpAuthenticateAndConnectService {
  private readonly sessionTimeoutMs: number;
  private readonly tokenScope: OcpAttemptTokenScope;

  constructor(private readonly deps: OcpAuthenticateAndConnectDeps) {
    this.sessionTimeoutMs = deps.sessionTimeoutMs ?? OCP_AUTH_SESSION_TIMEOUT_MS;
    this.tokenScope = deps.tokenScope ?? new OcpAttemptTokenScope();
  }

  getTokenScope(): OcpAttemptTokenScope {
    return this.tokenScope;
  }

  async execute(
    input: OcpAuthenticateAndConnectInput,
  ): Promise<Result<void, PlatformError>> {
    const attemptId = input.correlationId ?? createCorrelationId();
    return this.connectWithFreshToken({
      domain: input.domain,
      login: input.login,
      apiKey: input.apiKey,
      attemptId,
      closeExisting: true,
    });
  }

  /**
   * Close stale socket (if any), acquire fresh HTTP token, open one new socket, send auth.
   */
  async retryServer(
    input: OcpAuthenticateAndConnectInput,
  ): Promise<Result<void, PlatformError>> {
    const attemptId = input.correlationId ?? createCorrelationId();
    return this.connectWithFreshToken({
      domain: input.domain,
      login: input.login,
      apiKey: input.apiKey,
      attemptId,
      closeExisting: true,
    });
  }

  /**
   * Resend auth on the same open socket using the attempt-scoped token.
   * Does not create a second socket or call HTTP authenticate.
   */
  async retryAuthorization(
    attemptId?: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const activeAttemptId =
      attemptId ?? this.deps.projectionHub.getSessionProjection().activeAttemptId;
    if (activeAttemptId === null) {
      return err(
        createPlatformError("operation_failed", "ocp_auth_retry_no_attempt", {
          reason: "ocp_auth_retry_no_attempt",
        }),
      );
    }

    if (this.deps.ocpGateway.getConnectionState() !== "connected") {
      return err(
        createPlatformError("operation_failed", "ocp_auth_retry_socket_not_open", {
          reason: "ocp_auth_retry_socket_not_open",
        }),
      );
    }

    const token = this.tokenScope.getToken(activeAttemptId);
    if (token === null) {
      return err(
        createPlatformError("operation_failed", "ocp_auth_retry_token_missing", {
          reason: "ocp_auth_retry_token_missing",
        }),
      );
    }

    this.deps.logger.info("ocp_retry_authorization_requested", {
      correlationId: activeAttemptId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_retry_authorization",
      result: "requested",
    });

    this.deps.projectionHub.beginAttempt(activeAttemptId);
    this.deps.projectionHub.markAuthorizationPending(activeAttemptId);

    const sendResult = this.deps.ocpGateway.sendCommand({
      kind: "auth",
      token,
    });
    if (!sendResult.ok) {
      return sendResult;
    }

    return this.waitForAuthorized(activeAttemptId);
  }

  /** Clear attempt-scoped token on logout / terminal failure / supersession. */
  clearAttemptToken(): void {
    this.tokenScope.clear();
  }

  private async connectWithFreshToken(input: Readonly<{
    domain: string;
    login: string;
    apiKey: string;
    attemptId: CorrelationId;
    closeExisting: boolean;
  }>): Promise<Result<void, PlatformError>> {
    const domain = input.domain.trim();
    const login = input.login.trim();
    const apiKey = input.apiKey.trim();
    const { attemptId } = input;

    if (domain.length === 0) {
      return err(
        createPlatformError("validation_failed", "domain_required", {
          reason: "domain_required",
        }),
      );
    }
    if (login.length === 0) {
      this.deps.projectionHub.setAuthFeedback("LOGIN_REQUIRED");
      return err(
        createPlatformError("validation_failed", "login_required", {
          reason: "login_required",
        }),
      );
    }
    if (apiKey.length === 0) {
      this.deps.projectionHub.setAuthFeedback("API_KEY_REQUIRED");
      return err(
        createPlatformError("validation_failed", "api_key_required", {
          reason: "api_key_required",
        }),
      );
    }

    this.deps.projectionHub.beginAttempt(attemptId);
    this.tokenScope.clear();
    // Re-cancel after beginAttempt: hub notify can re-arm wasLive while still authorized.
    this.deps.cancelTransportRecovery?.("fresh_token_connect");

    this.deps.logger.info("ocp_authenticate_and_connect_requested", {
      correlationId: attemptId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_authenticate_and_connect",
      domain,
      login,
      result: "requested",
    });

    if (input.closeExisting) {
      const state = this.deps.ocpGateway.getConnectionState();
      if (state !== "disconnected") {
        await this.deps.disconnectOcp.execute({
          correlationId: attemptId,
          reason: "logout",
        });
      }
    }

    this.deps.onExecutionStage?.(
      "requesting_authorization_token",
      attemptId,
    );
    const authResult = await raceResultWithTimeout(
      this.deps.proxyAuthenticate.authenticate({
        domain,
        login,
        apiKey,
        correlationId: attemptId,
      }),
      OCP_SIGN_IN_STAGE_TIMEOUT_MS.requesting_authorization_token,
      "ocp_http_token_timeout",
    );

    if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
      return err(
        createPlatformError("operation_failed", "ocp_attempt_superseded", {
          reason: "ocp_attempt_superseded",
        }),
      );
    }

    if (!authResult.ok) {
      this.deps.projectionHub.setAuthFeedback("HTTP_AUTH_FAILED");
      this.deps.logger.warn("ocp_authenticate_and_connect_http_failed", {
        correlationId: attemptId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_authenticate_and_connect",
        domain,
        login,
        result: authResult.error.code,
      });
      this.tokenScope.clear();
      return authResult;
    }

    if (authResult.value.kind === "session_exist") {
      this.deps.projectionHub.setAuthFeedback("SESSION_EXIST");
      this.deps.logger.info("ocp_authenticate_and_connect_session_exist", {
        correlationId: attemptId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_authenticate_and_connect",
        domain,
        login,
        result: "session_exist",
      });
      this.tokenScope.clear();
      return err(
        createPlatformError("operation_failed", "ocp_session_exist", {
          reason: "ocp_session_exist",
        }),
      );
    }

    const ephemeralToken = authResult.value.token;
    this.tokenScope.begin(attemptId, ephemeralToken);
    this.deps.projectionHub.setSessionDomain(domain);
    this.deps.onExecutionStage?.("submitting_token_to_ocp", attemptId);

    const connectResult = await this.deps.connectOcp.execute({
      domain,
      authToken: ephemeralToken,
      correlationId: attemptId,
    });

    if (!connectResult.ok) {
      this.deps.projectionHub.setAuthFeedback("HTTP_AUTH_FAILED");
      this.tokenScope.clear();
      return connectResult;
    }
    this.deps.projectionHub.bindActiveAttemptToCurrentSocket(attemptId);

    if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
      this.tokenScope.clear();
      return err(
        createPlatformError("operation_failed", "ocp_attempt_superseded", {
          reason: "ocp_attempt_superseded",
        }),
      );
    }

    const connectedWait = await this.waitForServerConnected(attemptId);
    if (!connectedWait.ok) {
      this.tokenScope.clear();
      await this.deps.disconnectOcp.execute({ correlationId: attemptId });
      return connectedWait;
    }

    this.deps.projectionHub.markAuthorizationPending(attemptId);
    const sendResult = this.deps.ocpGateway.sendCommand({
      kind: "auth",
      token: ephemeralToken,
    });
    if (!sendResult.ok) {
      this.tokenScope.clear();
      await this.deps.disconnectOcp.execute({ correlationId: attemptId });
      return sendResult;
    }
    this.deps.onExecutionStage?.("awaiting_authorization_data", attemptId);

    const waitResult = await this.waitForAuthorized(attemptId);
    if (!waitResult.ok) {
      // Keep token for same-socket auth retry on AUTH_TIMEOUT; clear on hard failures.
      if (waitResult.error.message !== "ocp_auth_timeout") {
        this.tokenScope.clear();
        await this.deps.disconnectOcp.execute({ correlationId: attemptId });
      }
      return waitResult;
    }

    this.deps.logger.info("ocp_authenticate_and_connect_completed", {
      correlationId: attemptId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_authenticate_and_connect",
      domain,
      login,
      result: "completed",
    });

    return ok(undefined);
  }

  private waitForServerConnected(
    attemptId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    if (this.deps.ocpGateway.getConnectionState() === "connected") {
      return Promise.resolve(ok(undefined));
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: Result<void, PlatformError>): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(result);
      };

      const unsubscribe = this.deps.ocpGateway.onConnectionStateChange((state) => {
        if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
          finish(
            err(
              createPlatformError("operation_failed", "ocp_attempt_superseded", {
                reason: "ocp_attempt_superseded",
              }),
            ),
          );
          return;
        }
        if (state === "connected") {
          finish(ok(undefined));
          return;
        }
        if (state === "failed" || state === "disconnected") {
          finish(
            err(
              createPlatformError("operation_failed", "ocp_transport_failed", {
                reason: "ocp_transport_failed",
                state,
              }),
            ),
          );
        }
      });

      const timer = setTimeout(() => {
        finish(
          err(
            createPlatformError("timeout", "ocp_transport_connect_timeout", {
              reason: "ocp_transport_connect_timeout",
            }),
          ),
        );
      }, this.sessionTimeoutMs);
    });
  }

  private waitForAuthorized(
    attemptId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    const session = this.deps.projectionHub.getSessionProjection();
    if (
      this.deps.projectionHub.isActiveAttempt(attemptId) &&
      session.authorizationState.phase === "authorized"
    ) {
      return Promise.resolve(ok(undefined));
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: Result<void, PlatformError>): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        unsubscribeHub();
        unsubscribeGateway();
        resolve(result);
      };

      const unsubscribeHub = this.deps.projectionHub.subscribe(() => {
        if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
          finish(
            err(
              createPlatformError("operation_failed", "ocp_attempt_superseded", {
                reason: "ocp_attempt_superseded",
              }),
            ),
          );
          return;
        }
        const current = this.deps.projectionHub.getSessionProjection();
        if (current.authorizationState.phase === "authorized") {
          finish(ok(undefined));
          return;
        }
        if (current.authorizationState.phase === "rejected") {
          finish(
            err(
              createPlatformError("operation_failed", "ocp_authenticate_rejected", {
                reason: "ocp_authenticate_rejected",
                code: current.authorizationState.reason,
              }),
            ),
          );
        }
      });

      const unsubscribeGateway = this.deps.ocpGateway.onConnectionStateChange(
        (state) => {
          if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
            return;
          }
          if (state === "failed" || state === "disconnected") {
            const authPhase =
              this.deps.projectionHub.getSessionProjection().authorizationState
                .phase;
            if (authPhase === "rejected") {
              return;
            }
            this.deps.projectionHub.setAuthFeedback("HTTP_AUTH_FAILED");
            finish(
              err(
                createPlatformError("operation_failed", "ocp_transport_failed", {
                  reason: "ocp_transport_failed",
                  state,
                }),
              ),
            );
          }
        },
      );

      const timer = setTimeout(() => {
        if (!this.deps.projectionHub.isActiveAttempt(attemptId)) {
          finish(
            err(
              createPlatformError("operation_failed", "ocp_attempt_superseded", {
                reason: "ocp_attempt_superseded",
              }),
            ),
          );
          return;
        }
        this.deps.projectionHub.setAuthFeedback("AUTH_TIMEOUT");
        this.deps.logger.warn("ocp_authenticate_and_connect_timeout", {
          correlationId: attemptId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_authenticate_and_connect",
          result: "auth_timeout",
        });
        finish(
          err(
            createPlatformError("timeout", "ocp_auth_timeout", {
              reason: "ocp_auth_timeout",
            }),
          ),
        );
      }, this.sessionTimeoutMs);
    });
  }
}

async function raceResultWithTimeout<T>(
  operation: Promise<Result<T, PlatformError>>,
  timeoutMs: number,
  reason: string,
): Promise<Result<T, PlatformError>> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<Result<T, PlatformError>>((resolve) => {
    timer = setTimeout(() => {
      resolve(
        err(
          createPlatformError("operation_failed", reason, {
            reason,
          }),
        ),
      );
    }, timeoutMs);
  });
  const result = await Promise.race([operation, timeout]);
  if (timer !== null) {
    clearTimeout(timer);
  }
  return result;
}
