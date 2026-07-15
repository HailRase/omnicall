/**
 * - Purpose: HTTP authenticate → ephemeral WS connect → wait for authenticated (15s).
 * - Inputs: domain, login, apiKey; ports for HTTP + ConnectOcp + session projection hub.
 * - Outputs: success, SESSION_EXIST feedback, AUTH_TIMEOUT, or PlatformError (token never persisted).
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

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

/** Wait for OCP `authenticated` after WS connect before surfacing timeout toast. */
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
  now?: () => number;
}>;

export class OcpAuthenticateAndConnectService {
  private readonly sessionTimeoutMs: number;

  constructor(private readonly deps: OcpAuthenticateAndConnectDeps) {
    this.sessionTimeoutMs = deps.sessionTimeoutMs ?? OCP_AUTH_SESSION_TIMEOUT_MS;
  }

  async execute(
    input: OcpAuthenticateAndConnectInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const domain = input.domain.trim();
    const login = input.login.trim();
    const apiKey = input.apiKey.trim();

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

    this.deps.logger.info("ocp_authenticate_and_connect_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_authenticate_and_connect",
      domain,
      login,
      result: "requested",
    });

    const authResult = await this.deps.proxyAuthenticate.authenticate({
      domain,
      login,
      apiKey,
      correlationId,
    });

    if (!authResult.ok) {
      this.deps.projectionHub.setAuthFeedback("HTTP_AUTH_FAILED");
      this.deps.logger.warn("ocp_authenticate_and_connect_http_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_authenticate_and_connect",
        domain,
        login,
        result: authResult.error.code,
      });
      return authResult;
    }

    if (authResult.value.kind === "session_exist") {
      this.deps.projectionHub.setAuthFeedback("SESSION_EXIST");
      this.deps.logger.info("ocp_authenticate_and_connect_session_exist", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_authenticate_and_connect",
        domain,
        login,
        result: "session_exist",
      });
      return err(
        createPlatformError("operation_failed", "ocp_session_exist", {
          reason: "ocp_session_exist",
        }),
      );
    }

    const ephemeralToken = authResult.value.token;
    this.deps.projectionHub.setSessionDomain(domain);

    const connectResult = await this.deps.connectOcp.execute({
      domain,
      authToken: ephemeralToken,
      correlationId,
    });

    if (!connectResult.ok) {
      this.deps.projectionHub.setAuthFeedback("HTTP_AUTH_FAILED");
      return connectResult;
    }

    const waitResult = await this.waitForAuthenticated(correlationId);
    if (!waitResult.ok) {
      await this.deps.disconnectOcp.execute({ correlationId });
      return waitResult;
    }

    this.deps.logger.info("ocp_authenticate_and_connect_completed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_authenticate_and_connect",
      domain,
      login,
      result: "completed",
    });

    return ok(undefined);
  }

  private waitForAuthenticated(
    correlationId: CorrelationId,
  ): Promise<Result<void, PlatformError>> {
    if (this.deps.ocpGateway.getConnectionState() === "authenticated") {
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
        if (state === "authenticated") {
          finish(ok(undefined));
          return;
        }
        if (state === "sessionClosed" || state === "failed") {
          this.deps.projectionHub.setAuthFeedback(
            state === "sessionClosed" ? "SESSION_EXIST" : "HTTP_AUTH_FAILED",
          );
          finish(
            err(
              createPlatformError("operation_failed", "ocp_authenticate_session_closed", {
                reason: "ocp_authenticate_session_closed",
                state,
              }),
            ),
          );
        }
      });

      const timer = setTimeout(() => {
        this.deps.projectionHub.setAuthFeedback("AUTH_TIMEOUT");
        this.deps.logger.warn("ocp_authenticate_and_connect_timeout", {
          correlationId,
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
