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
  OCP_SIGN_IN_EXECUTION_STAGES,
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
  clearAuthorizationProgress,
  mapAuthorizationFailureKind,
  mapAuthorizationFailureStage,
  withAuthorizationProgressUiSurface,
  type AuthorizationProgressStage,
  type AuthorizationProgressUiSurface,
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
  /**
   * Shell surface for progress. Default `modal` (Login / SDK / modal Reconnect).
   * Transport auto-recovery must pass `silent` (banner only).
   */
  progressUiSurface?: AuthorizationProgressUiSurface;
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
  /**
   * Ownership token for the active execute/retryAuthorization run.
   * Cleared only by the owning run's `finally` or by explicit supersession cancel.
   */
  private activeRunId: CorrelationId | null = null;

  constructor(private readonly deps: OcpBackedSignInOrchestrationDeps) {}

  isInFlight(): boolean {
    return this.activeRunId !== null;
  }

  async execute(
    input: OcpBackedSignInInput,
  ): Promise<Result<OcpBackedSignInOutcome, PlatformError>> {
    if (this.activeRunId !== null) {
      return err(
        createPlatformError("operation_failed", "ocp_sign_in_in_flight", {
          reason: "ocp_sign_in_in_flight",
        }),
      );
    }

    const correlationId = input.correlationId ?? createCorrelationId();
    const runId = correlationId;
    this.activeRunId = runId;
    this.deps.cancelTransportRecovery?.("sign_in_supersede");
    const progressUiSurface = input.progressUiSurface ?? "modal";

    try {
      if (
        !this.beginProgressAttempt(correlationId, runId, progressUiSurface)
      ) {
        return this.cancelledResult();
      }

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

      if (!this.setProgress("connecting_ocp", correlationId, runId)) {
        this.deps.sipCredentialService.cancelWait(
          correlationId,
          createPlatformError("operation_failed", "ocp_attempt_cancelled", {
            reason: "ocp_attempt_cancelled",
          }),
        );
        await credentialsWait;
        return this.cancelledResult();
      }

      const connectResult = await this.deps.authenticateAndConnect.execute({
        domain: input.domain,
        login: input.login,
        apiKey: input.apiKey,
        correlationId,
      });

      if (!this.isCurrentRun(runId)) {
        this.deps.sipCredentialService.cancelWait(
          correlationId,
          createPlatformError("operation_failed", "ocp_attempt_cancelled", {
            reason: "ocp_attempt_cancelled",
          }),
        );
        await credentialsWait;
        return this.cancelledResult();
      }

      if (!connectResult.ok) {
        this.deps.sipCredentialService.cancelWait(
          correlationId,
          connectResult.error,
        );
        await credentialsWait;
        if (!this.isCurrentRun(runId)) {
          return this.cancelledResult();
        }
        const stage = mapAuthorizationFailureStage(connectResult.error.message);
        this.setProgress(stage, correlationId, runId);
        this.markExecutionFailure(connectResult.error.message, runId);
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

      if (!this.enterCredentialsWait(correlationId, correlationId, runId)) {
        return this.cancelledResult();
      }
      const applyResult = await credentialsWait;
      if (!this.isCurrentRun(runId)) {
        return this.cancelledResult();
      }
      if (!applyResult.ok) {
        const stage = mapAuthorizationFailureStage(applyResult.error.message);
        this.setProgress(stage, correlationId, runId);
        this.markExecutionFailure(
          applyResult.error.message,
          runId,
          "receiving_phone_credentials",
        );
        if (applyResult.error.message === "ocp_credentials_timeout") {
          this.deps.projectionHub.setAuthFeedback("CREDENTIALS_TIMEOUT");
        }
        this.deps.authenticateAndConnect.clearAttemptToken();
        return err(applyResult.error);
      }

      const mapped = this.mapApplyOutcome(applyResult.value, correlationId, runId);
      if (mapped.ok && mapped.value.phase === "sip_ready") {
        this.deps.authenticateAndConnect.clearAttemptToken();
      }
      return mapped;
    } finally {
      this.endRun(runId);
    }
  }

  /**
   * Auth-only retry over the open socket (no second socket, no fresh HTTP).
   */
  async retryAuthorization(
    input: OcpAuthorizationRetryInput = {},
  ): Promise<Result<OcpBackedSignInOutcome, PlatformError>> {
    if (this.activeRunId !== null) {
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
    const runId = operationCorrelationId;
    this.activeRunId = runId;
    try {
      const credentialsWait =
        this.deps.sipCredentialService.waitAndApplyNext(targetAttemptId);
      const authorizationResult =
        await this.deps.authenticateAndConnect.retryAuthorization(targetAttemptId);
      if (!this.isCurrentRun(runId)) {
        this.deps.sipCredentialService.cancelWait(
          targetAttemptId,
          createPlatformError("operation_failed", "ocp_attempt_cancelled", {
            reason: "ocp_attempt_cancelled",
          }),
        );
        await credentialsWait;
        return this.cancelledResult();
      }
      if (!authorizationResult.ok) {
        this.deps.sipCredentialService.cancelWait(
          targetAttemptId,
          authorizationResult.error,
        );
        await credentialsWait;
        if (!this.isCurrentRun(runId)) {
          return this.cancelledResult();
        }
        return authorizationResult;
      }
      if (
        !this.enterCredentialsWait(
          operationCorrelationId,
          targetAttemptId,
          runId,
        )
      ) {
        return this.cancelledResult();
      }
      const applyResult = await credentialsWait;
      if (!this.isCurrentRun(runId)) {
        return this.cancelledResult();
      }
      if (!applyResult.ok) {
        const stage = mapAuthorizationFailureStage(applyResult.error.message);
        this.setProgress(stage, operationCorrelationId, runId);
        this.markExecutionFailure(
          applyResult.error.message,
          runId,
          "receiving_phone_credentials",
        );
        return applyResult;
      }
      const mapped = this.mapApplyOutcome(
        applyResult.value,
        operationCorrelationId,
        runId,
      );
      if (mapped.ok && mapped.value.phase === "sip_ready") {
        this.deps.authenticateAndConnect.clearAttemptToken();
      }
      return mapped;
    } finally {
      this.endRun(runId);
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

  /**
   * Seed a visible execution stage immediately (before async recovery I/O).
   * Full restarts clear prior stage history; partial recoveries keep completed prefixes.
   */
  seedVisibleRecoveryStage(
    executionStage: OcpSignInExecutionStage,
    correlationId: CorrelationId,
    options?: Readonly<{ resetCompletedStages?: boolean }>,
  ): void {
    const reset = options?.resetCompletedStages === true;
    const base = reset
      ? clearAuthorizationProgress()
      : this.deps.projectionHub.getSessionProjection().authorizationProgress;
    this.deps.projectionHub.setAuthorizationProgress(
      applyAuthorizationExecutionStage(
        withAuthorizationProgressUiSurface(base, "modal"),
        executionStage,
        correlationId,
      ),
    );
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
   * Ownership is cleared immediately so a newer recover/execute can start; the superseded
   * run's `finally` must not clear a newer run (guarded by run identity).
   */
  cancelUserSignIn(reason = "user_cancel"): void {
    const attemptId =
      this.deps.projectionHub.getSessionProjection().activeAttemptId;
    const cancelError = createPlatformError(
      "operation_failed",
      "ocp_attempt_cancelled",
      { reason: "ocp_attempt_cancelled" },
    );
    if (attemptId !== null) {
      this.deps.sipCredentialService.cancelWait(attemptId, cancelError);
    } else {
      this.deps.sipCredentialService.cancelInFlightApplies();
    }
    // Supersede ownership before terminate so late setProgress is ignored.
    this.activeRunId = null;
    this.terminateAttempt(reason);
  }

  private isCurrentRun(runId: CorrelationId): boolean {
    return this.activeRunId === runId;
  }

  private endRun(runId: CorrelationId): void {
    if (this.activeRunId === runId) {
      this.activeRunId = null;
    }
  }

  private cancelledResult(): Result<OcpBackedSignInOutcome, PlatformError> {
    return err(
      createPlatformError("operation_failed", "ocp_attempt_cancelled", {
        reason: "ocp_attempt_cancelled",
      }),
    );
  }

  private mapApplyOutcome(
    outcome: OcpSipCredentialApplyOutcome,
    correlationId: CorrelationId,
    runId: CorrelationId,
  ): Result<OcpBackedSignInOutcome, PlatformError> {
    if (!this.isCurrentRun(runId)) {
      return this.cancelledResult();
    }
    switch (outcome.kind) {
      case "cancelled":
        return this.cancelledResult();
      case "applied":
      case "already_matching": {
        if (!this.setProgress("ready", correlationId, runId)) {
          return this.cancelledResult();
        }
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
        this.setProgress("ocp_connected_sip_failed", correlationId, runId);
        this.markExecutionFailure(error.message, runId);
        this.deps.projectionHub.setAuthFeedback("SIP_IDENTITY_MISMATCH");
        return ok({
          phase: "ocp_authenticated_sip_failed",
          correlationId,
          stage: "ocp_connected_sip_failed",
          error,
        });
      }
      case "authorize_failed": {
        this.setProgress("ocp_connected_sip_failed", correlationId, runId);
        this.markExecutionFailure(outcome.error.message, runId);
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
        this.setProgress("sip_registration_failed", correlationId, runId);
        this.markExecutionFailure(outcome.error.message, runId);
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

  /**
   * @returns false when the run is no longer active (caller must not continue side effects).
   */
  private beginProgressAttempt(
    correlationId: CorrelationId,
    runId: CorrelationId,
    uiSurface: AuthorizationProgressUiSurface,
  ): boolean {
    if (!this.isCurrentRun(runId)) {
      return false;
    }
    this.deps.projectionHub.setAuthorizationProgress(
      applyAuthorizationProgressStage(
        withAuthorizationProgressUiSurface(
          clearAuthorizationProgress(),
          uiSurface,
        ),
        "preparing",
        correlationId,
      ),
    );
    return true;
  }

  private setProgress(
    stage: AuthorizationProgressStage,
    correlationId: CorrelationId,
    runId: CorrelationId,
  ): boolean {
    if (!this.isCurrentRun(runId)) {
      return false;
    }
    this.deps.projectionHub.setAuthorizationProgress(
      applyAuthorizationProgressStage(
        this.deps.projectionHub.getSessionProjection().authorizationProgress,
        stage,
        correlationId,
      ),
    );
    return true;
  }

  /**
   * After OCP authorized: show credentials stage, start waiter budget, keep legacy stage.
   * `waiterCorrelationId` must match the armed `waitAndApplyNext` attempt id.
   * If early `creds` already advanced progress to SIP stages, do not regress UI —
   * only arm the credentials timeout (no-op when the waiter already settled).
   */
  private enterCredentialsWait(
    progressCorrelationId: CorrelationId,
    waiterCorrelationId: CorrelationId,
    runId: CorrelationId,
  ): boolean {
    if (!this.isCurrentRun(runId)) {
      return false;
    }
    const current =
      this.deps.projectionHub.getSessionProjection().authorizationProgress;
    const receivingIndex = OCP_SIGN_IN_EXECUTION_STAGES.indexOf(
      "receiving_phone_credentials",
    );
    const currentIndex =
      current.executionStage === null
        ? -1
        : OCP_SIGN_IN_EXECUTION_STAGES.indexOf(current.executionStage);

    if (currentIndex <= receivingIndex) {
      const withStage = applyAuthorizationExecutionStage(
        current,
        "receiving_phone_credentials",
        progressCorrelationId,
      );
      this.deps.projectionHub.setAuthorizationProgress(
        applyAuthorizationProgressStage(
          withStage,
          "receiving_credentials",
          progressCorrelationId,
        ),
      );
    }
    this.deps.sipCredentialService.beginCredentialsTimeout(waiterCorrelationId);
    return true;
  }

  private markExecutionFailure(
    message: string,
    runId: CorrelationId,
    failedStage?: OcpSignInExecutionStage | null,
  ): void {
    if (!this.isCurrentRun(runId)) {
      return;
    }
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
