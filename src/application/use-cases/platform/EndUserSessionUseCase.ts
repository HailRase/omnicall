import { createUserSessionEndedEvent } from "@domain/platform/userSessionEvents.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type {
  SessionTeardownOrchestrationService,
  SessionTeardownOutcome,
} from "../../services/platform/SessionTeardownOrchestrationService.js";

const FEATURE_ID = "F-014";

export type EndUserSessionInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: SIP-only user session logout entry point (LF-079, LF-048 SIP).
 * - Inputs: optional correlation id.
 * - Outputs: ordered SIP teardown and UserSessionEnded event.
 */
export class EndUserSessionUseCase {
  private logoutCompletedForCurrentSession = false;

  constructor(
    private readonly sessionTeardown: SessionTeardownOrchestrationService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {
    this.eventPublisher.subscribe((event) => {
      // New local account session (Login) or SIP-ready both re-arm logout (ADR-AF-005).
      if (
        event.type === "RegistrationSucceeded" ||
        event.type === "AccountSessionActivated"
      ) {
        this.logoutCompletedForCurrentSession = false;
      }
    });
  }

  async execute(
    input: EndUserSessionInput = {},
  ): Promise<Result<SessionTeardownOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    if (this.logoutCompletedForCurrentSession) {
      this.logger.info("end_user_session_skipped", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "end_user_session",
        result: "already_completed",
      });
      return ok({ steps: [] });
    }

    this.logger.info("end_user_session_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "end_user_session",
      previousState: "authenticated",
      nextState: "logout_in_progress",
    });

    const teardownResult = await this.sessionTeardown.execute({
      correlationId,
      operation: "end_user_session",
    });

    if (!teardownResult.ok) {
      // Concurrent teardown must not clear the account session (ADR-AF-005).
      if (isTeardownInProgressError(teardownResult.error)) {
        this.logger.error(
          "end_user_session_failed",
          {
            correlationId,
            featureId: FEATURE_ID,
            boundedContext: "Telephony",
            operation: "end_user_session",
            result: teardownResult.error.code,
          },
          teardownResult.error,
        );
        return teardownResult;
      }

      // Best-effort: SIP may already be gone after a partial step failure — still end
      // the local account session so Login re-enables (aligned with SafeLogoutUseCase).
      this.logger.warn("end_user_session_sip_partial_failure", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "end_user_session",
        result: teardownResult.error.code,
      });
    } else if (teardownResult.value.steps.length === 0) {
      this.logger.warn("end_user_session_incomplete_teardown", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "end_user_session",
        result: "no_teardown_steps",
      });
      return err(
        createPlatformError("operation_failed", "Session teardown produced no steps", {
          reason: "teardown_incomplete",
        }),
      );
    }

    this.eventPublisher.publish(createUserSessionEndedEvent(correlationId));

    this.logger.info("end_user_session_completed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "end_user_session",
      result: teardownResult.ok ? "completed" : "completed_with_sip_partial_failure",
      nextState: "session_ended",
    });

    this.logoutCompletedForCurrentSession = true;

    return ok(teardownResult.ok ? teardownResult.value : { steps: [] });
  }
}

function isTeardownInProgressError(error: PlatformError): boolean {
  if (typeof error.cause !== "object" || error.cause === null) {
    return false;
  }
  return (error.cause as Readonly<{ reason?: unknown }>).reason === "teardown_in_progress";
}
