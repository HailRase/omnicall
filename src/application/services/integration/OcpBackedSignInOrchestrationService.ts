/**
 * - Purpose: own OCP-backed sign-in through SIP-ready success with one correlation ID.
 * - Inputs: domain/login/apiKey + authenticate/connect + credential apply ports.
 * - Outputs: typed phase result (sip_ready vs ocp-only failure) + progress projection updates.
 */

import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationProgressStage,
  clearAuthorizationProgress,
  mapAuthorizationFailureKind,
  mapAuthorizationFailureStage,
  type AuthorizationProgressStage,
  type OcpSignInExecutionStage,
} from "../../projections/settings/authorizationProgressProjection.js";
import type { OcpAuthenticateAndConnectService } from "./OcpAuthenticateAndConnectService.js";
import type {
  OcpSipCredentialApplyOutcome,
  OcpSipCredentialService,
} from "./OcpSipCredentialService.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

export type OcpBackedSignInInput = Readonly<{
  domain: string;
  login: string;
  apiKey: string;
  correlationId?: CorrelationId;
}>;

export type OcpAuthorizationRetryInput = Readonly<{
  operationCorrelationId?: CorrelationId;
  targetAttemptId?: CorrelationId;
}>;

/**
 * Distinguishes OCP transport success from final phone-ready success.
 * Callers must treat only `sip_ready` as user-visible authorization success.
 */
export type OcpBackedSignInOutcome =
  | Readonly<{ phase: "sip_ready"; correlationId: CorrelationId }>
  | Readonly<{
      phase: "ocp_authenticated_sip_failed";
      correlationId: CorrelationId;
      stage: AuthorizationProgressStage;
      error: PlatformError;
    }>;

export type OcpBackedSignInOrchestrationDeps = Readonly<{
  authenticateAndConnect: OcpAuthenticateAndConnectService;
  sipCredentialService: OcpSipCredentialService;
  projectionHub: OcpProjectionHub;
  logger: Logger;
  /** Cancel Application-owned transport recovery when a new attempt supersedes it. */
  cancelTransportRecovery?: (reason: string) => void;
}>;

export class OcpBackedSignInOrchestrationService {
  private inFlight = false;

  constructor(private readonly deps: OcpBackedSignInOrchestrationDeps) {}

  async execute(
    input: OcpBackedSignInInput,
  ): Promise<Result<OcpBackedSignInOutcome, PlatformError>> {
    if (this.inFlight) {
      return err(
        createPlatformError("operation_failed", "ocp_sign_in_in_flight", {
          reason: "ocp_sign_in_in_flight",
        }),
      );
    }

    const correlationId = input.correlationId ?? createCorrelationId();
    this.inFlight = true;
    this.deps.cancelTransportRecovery?.("sign_in_supersede");

    try {
      this.setProgress("preparing", correlationId);

      this.deps.logger.info("ocp_backed_sign_in_requested", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_backed_sign_in",
        domain: input.domain.trim(),
        login: input.login.trim(),
        result: "requested",
      });

      // Arm credentials waiter before HTTP/WS so early `creds` are not missed.
      const credentialsWait =
        this.deps.sipCredentialService.waitAndApplyNext(correlationId);

      this.setProgress("connecting_ocp", correlationId);
      const connectResult = await this.deps.authenticateAndConnect.execute({
        domain: input.domain,
        login: input.login,
        apiKey: input.apiKey,
        correlationId,
      });

      if (!connectResult.ok) {
        this.deps.sipCredentialService.cancelWait(
          correlationId,
          connectResult.error,
        );
        await credentialsWait;
        const stage = mapAuthorizationFailureStage(connectResult.error.message);
        this.setProgress(stage, correlationId);
        this.markExecutionFailure(connectResult.error.message);
        if (connectResult.error.message !== "ocp_auth_timeout") {
          this.deps.authenticateAndConnect.clearAttemptToken();
        }
        this.deps.logger.warn("ocp_backed_sign_in_ocp_failed", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_backed_sign_in",
          result: connectResult.error.message,
          stage,
        });
        return connectResult;
      }

      this.setProgress("receiving_credentials", correlationId);
      const applyResult = await credentialsWait;
      if (!applyResult.ok) {
        const stage = mapAuthorizationFailureStage(applyResult.error.message);
        this.setProgress(stage, correlationId);
        this.markExecutionFailure(applyResult.error.message);
        if (applyResult.error.message === "ocp_credentials_timeout") {
          this.deps.projectionHub.setAuthFeedback("CREDENTIALS_TIMEOUT");
        }
        this.deps.authenticateAndConnect.clearAttemptToken();
        return err(applyResult.error);
      }

      const mapped = this.mapApplyOutcome(applyResult.value, correlationId);
      if (mapped.ok && mapped.value.phase === "sip_ready") {
        this.deps.authenticateAndConnect.clearAttemptToken();
      }
      return mapped;
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * Auth-only retry over the open socket (no second socket, no fresh HTTP).
   */
  async retryAuthorization(
    input: OcpAuthorizationRetryInput = {},
  ): Promise<Result<OcpBackedSignInOutcome, PlatformError>> {
    if (this.inFlight) {
      return err(
        createPlatformError("operation_failed", "ocp_sign_in_in_flight", {
          reason: "ocp_sign_in_in_flight",
        }),
      );
    }
    const targetAttemptId =
      input.targetAttemptId ??
      this.deps.projectionHub.getSessionProjection().activeAttemptId;
    if (targetAttemptId === null) {
      return err(
        createPlatformError("operation_failed", "ocp_auth_retry_no_attempt", {
          reason: "ocp_auth_retry_no_attempt",
        }),
      );
    }
    const operationCorrelationId =
      input.operationCorrelationId ?? createCorrelationId();
    this.inFlight = true;
    try {
      const credentialsWait =
        this.deps.sipCredentialService.waitAndApplyNext(targetAttemptId);
      const authorizationResult =
        await this.deps.authenticateAndConnect.retryAuthorization(targetAttemptId);
      if (!authorizationResult.ok) {
        this.deps.sipCredentialService.cancelWait(
          targetAttemptId,
          authorizationResult.error,
        );
        await credentialsWait;
        return authorizationResult;
      }
      this.setProgress("receiving_credentials", operationCorrelationId);
      const applyResult = await credentialsWait;
      if (!applyResult.ok) {
        const stage = mapAuthorizationFailureStage(applyResult.error.message);
        this.setProgress(stage, operationCorrelationId);
        this.markExecutionFailure(applyResult.error.message);
        return applyResult;
      }
      const mapped = this.mapApplyOutcome(applyResult.value, operationCorrelationId);
      if (mapped.ok && mapped.value.phase === "sip_ready") {
        this.deps.authenticateAndConnect.clearAttemptToken();
      }
      return mapped;
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * Fresh-token server retry / reconnect (close → HTTP → one new socket → auth).
   */
  async retryServer(
    input: OcpBackedSignInInput,
  ): Promise<Result<OcpBackedSignInOutcome, PlatformError>> {
    return this.execute(input);
  }

  clearProgress(): void {
    this.deps.projectionHub.setAuthorizationProgress(clearAuthorizationProgress());
  }

  /** Terminal cleanup: timers/waiters/token/recovery. */
  terminateAttempt(reason: string): void {
    this.deps.cancelTransportRecovery?.(reason);
    this.deps.authenticateAndConnect.clearAttemptToken();
    this.deps.projectionHub.clearAttempt();
    this.clearProgress();
  }

  /**
   * User cancel from Account progress modal: supersede waiters and clear progress to idle.
   * Caller still disconnects the OCP socket when needed.
   */
  cancelUserSignIn(reason = "user_cancel"): void {
    const attemptId =
      this.deps.projectionHub.getSessionProjection().activeAttemptId;
    if (attemptId !== null) {
      this.deps.sipCredentialService.cancelWait(
        attemptId,
        createPlatformError("operation_failed", "ocp_attempt_cancelled", {
          reason: "ocp_attempt_cancelled",
        }),
      );
    }
    this.terminateAttempt(reason);
    this.inFlight = false;
  }

  private mapApplyOutcome(
    outcome: OcpSipCredentialApplyOutcome,
    correlationId: CorrelationId,
  ): Result<OcpBackedSignInOutcome, PlatformError> {
    switch (outcome.kind) {
      case "applied":
      case "already_matching": {
        this.setProgress("ready", correlationId);
        this.deps.logger.info("ocp_backed_sign_in_sip_ready", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_backed_sign_in",
          result: outcome.kind,
        });
        return ok({ phase: "sip_ready", correlationId });
      }
      case "identity_mismatch": {
        const error = createPlatformError(
          "operation_failed",
          "ocp_sip_identity_mismatch",
          { reason: "ocp_sip_identity_mismatch" },
        );
        this.setProgress("ocp_connected_sip_failed", correlationId);
        this.markExecutionFailure(error.message);
        this.deps.projectionHub.setAuthFeedback("SIP_IDENTITY_MISMATCH");
        return ok({
          phase: "ocp_authenticated_sip_failed",
          correlationId,
          stage: "ocp_connected_sip_failed",
          error,
        });
      }
      case "authorize_failed": {
        this.setProgress("ocp_connected_sip_failed", correlationId);
        this.markExecutionFailure(outcome.error.message);
        return ok({
          phase: "ocp_authenticated_sip_failed",
          correlationId,
          stage: "ocp_connected_sip_failed",
          error: createPlatformError(
            "operation_failed",
            "ocp_sip_authorize_failed",
            {
              reason: "ocp_sip_authorize_failed",
              cause: outcome.error.code,
            },
          ),
        });
      }
      case "register_failed": {
        this.setProgress("sip_registration_failed", correlationId);
        this.markExecutionFailure(outcome.error.message);
        this.deps.projectionHub.setAuthFeedback("SIP_REGISTRATION_FAILED");
        return ok({
          phase: "ocp_authenticated_sip_failed",
          correlationId,
          stage: "sip_registration_failed",
          error: createPlatformError(
            "operation_failed",
            "ocp_sip_register_failed",
            {
              reason: "ocp_sip_register_failed",
              cause: outcome.error.code,
            },
          ),
        });
      }
      default: {
        const _exhaustive: never = outcome;
        return _exhaustive;
      }
    }
  }

  private setProgress(
    stage: AuthorizationProgressStage,
    correlationId: CorrelationId,
  ): void {
    this.deps.projectionHub.setAuthorizationProgress(
      applyAuthorizationProgressStage(
        this.deps.projectionHub.getSessionProjection().authorizationProgress,
        stage,
        correlationId,
      ),
    );
  }

  private markExecutionFailure(
    message: string,
    failedStage?: OcpSignInExecutionStage | null,
  ): void {
    const current =
      this.deps.projectionHub.getSessionProjection().authorizationProgress;
    const failureKind = mapAuthorizationFailureKind(message);
    this.deps.projectionHub.setAuthorizationProgress(
      applyAuthorizationExecutionFailure(current, {
        reason: failureKind === "timeout" || failureKind === "credentials_timeout"
          ? "timeout"
          : "failed",
        failureKind,
        failureCode: message,
        failedStage:
          failedStage !== undefined ? failedStage : current.executionStage,
      }),
    );
  }
}
