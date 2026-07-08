import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SessionTeardownOrchestrationService } from "../../services/platform/SessionTeardownOrchestrationService.js";

const FEATURE_ID = "F-014";

export type SafeLogoutInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated safe logout after session termination.
 * - Inputs: optional correlation id.
 * - Outputs: SIP teardown via orchestrator.
 */
export class SafeLogoutUseCase {
  constructor(
    private readonly sessionTeardown: SessionTeardownOrchestrationService,
    private readonly logger: Logger,
  ) {}

  async execute(input: SafeLogoutInput = {}): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.logger.info("safe_logout_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "safe_logout",
      previousState: "active",
      nextState: "logout_in_progress",
    });

    try {
      const teardownResult = await this.sessionTeardown.execute({
        correlationId,
        operation: "safe_logout",
      });

      if (!teardownResult.ok) {
        this.logger.warn("safe_logout_sip_partial_failure", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "safe_logout",
          result: teardownResult.error.code,
        });
      }

      this.logger.info("safe_logout_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "safe_logout",
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "safe_logout_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "safe_logout",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
