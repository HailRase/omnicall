import type { CallEngine } from "@application/services/telephony/CallEngine.js";
import type { UnregisterAccountUseCase } from "@application/use-cases/settings/UnregisterAccountUseCase.js";
import type { Logger, MediaGateway } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SipRecoveryOrchestrationService } from "../recovery/SipRecoveryOrchestrationService.js";

const FEATURE_ID = "F-014";

export type SessionTeardownOperation =
  | "end_user_session"
  | "shutdown_cleanup"
  | "safe_logout"
  | "server_terminate_cleanup";

export type SessionTeardownStep =
  | "dispose_recovery"
  | "hangup_all_calls"
  | "release_all_media"
  | "sip_unregister";

export type SessionTeardownStepResult = Readonly<{
  step: SessionTeardownStep;
  ok: boolean;
  errorCode?: string;
}>;

export type SessionTeardownOutcome = Readonly<{
  steps: ReadonlyArray<SessionTeardownStepResult>;
}>;

export type SessionTeardownInput = Readonly<{
  correlationId: CorrelationId;
  operation: SessionTeardownOperation;
}>;

export type SessionTeardownOrchestrationDeps = Readonly<{
  sipRecoveryOrchestration: SipRecoveryOrchestrationService;
  callEngine: CallEngine;
  mediaGateway: MediaGateway;
  unregisterAccount: UnregisterAccountUseCase;
  logger: Logger;
}>;

/**
 * - Purpose: ordered SIP session teardown shared by logout and shutdown paths (LF-079).
 * - Inputs: correlation id and operation name.
 * - Outputs: best-effort step results through UnregisterAccountUseCase.
 */
export class SessionTeardownOrchestrationService {
  private teardownInProgress = false;

  constructor(private readonly deps: SessionTeardownOrchestrationDeps) {}

  async execute(input: SessionTeardownInput): Promise<Result<SessionTeardownOutcome, PlatformError>> {
    const { correlationId, operation } = input;

    if (this.teardownInProgress) {
      this.deps.logger.info("session_teardown_skipped", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation,
        result: "already_in_progress",
      });
      return err(
        createPlatformError("operation_failed", "Session teardown already in progress", {
          reason: "teardown_in_progress",
        }),
      );
    }

    this.teardownInProgress = true;

    this.deps.logger.info("session_teardown_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation,
      previousState: "active",
      nextState: "teardown_in_progress",
    });

    try {
      const steps: SessionTeardownStepResult[] = [];

      steps.push(await this.runStep(correlationId, operation, "dispose_recovery", () => {
        this.deps.sipRecoveryOrchestration.dispose();
        return ok(undefined);
      }));

      steps.push(
        await this.runStep(correlationId, operation, "hangup_all_calls", async () => {
          await this.deps.callEngine.hangupAllCalls(correlationId);
          return ok(undefined);
        }),
      );

      steps.push(
        await this.runStep(correlationId, operation, "release_all_media", () =>
          this.deps.mediaGateway.releaseAll({ correlationId }),
        ),
      );

      steps.push(
        await this.runStep(correlationId, operation, "sip_unregister", () =>
          this.deps.unregisterAccount.execute({ correlationId }),
        ),
      );

      const hasFailure = steps.some((step) => !step.ok);

      this.deps.logger.info("session_teardown_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation,
        result: hasFailure ? "partial_failure" : "completed",
        nextState: "teardown_completed",
      });

      if (hasFailure) {
        return err(
          normalizeUnknownError(
            new Error(`Session teardown completed with failures for ${operation}`),
          ),
        );
      }

      return ok({ steps });
    } finally {
      this.teardownInProgress = false;
    }
  }

  resetForTests(): void {
    this.teardownInProgress = false;
  }

  private async runStep(
    correlationId: CorrelationId,
    operation: SessionTeardownOperation,
    step: SessionTeardownStep,
    action: () => Promise<Result<void, PlatformError>> | Result<void, PlatformError> | void,
  ): Promise<SessionTeardownStepResult> {
    try {
      const result = await action();
      if (result !== undefined && !result.ok) {
        this.deps.logger.error(
          "session_teardown_step_failed",
          {
            correlationId,
            featureId: FEATURE_ID,
            boundedContext: step === "release_all_media" ? "Media" : "Telephony",
            operation,
            step,
            result: result.error.code,
          },
          result.error,
        );
        return { step, ok: false, errorCode: result.error.code };
      }

      this.deps.logger.info("session_teardown_step_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: step === "release_all_media" ? "Media" : "Telephony",
        operation,
        step,
        result: "succeeded",
      });

      return { step, ok: true };
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.deps.logger.error(
        "session_teardown_step_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: step === "release_all_media" ? "Media" : "Telephony",
          operation,
          step,
          result: normalized.code,
        },
        error,
      );
      return { step, ok: false, errorCode: normalized.code };
    }
  }
}
