import { createAppShutdownRequestedEvent } from "@domain/platform/appLifecycleEvents.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { AppShutdownSource } from "@shared/platform/AppLifecycle.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SessionTeardownOrchestrationService } from "../../services/platform/SessionTeardownOrchestrationService.js";

const FEATURE_ID = "F-014";

export type ShutdownCleanupInput = Readonly<{
  source: AppShutdownSource;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: ordered app shutdown cleanup for SIP sessions (LF-079).
 * - Inputs: shutdown source and optional correlation id.
 * - Outputs: SIP teardown via orchestrator; AppShutdownRequested.
 */
export class ShutdownCleanupUseCase {
  private cleanupCompleted = false;

  constructor(
    private readonly sessionTeardown: SessionTeardownOrchestrationService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: ShutdownCleanupInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    if (this.cleanupCompleted) {
      this.logger.info("shutdown_cleanup_skipped", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "shutdown_cleanup",
        result: "already_completed",
      });
      return ok(undefined);
    }

    this.eventPublisher.publish(
      createAppShutdownRequestedEvent(correlationId, { source: input.source }),
    );

    this.logger.info("shutdown_cleanup_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "shutdown_cleanup",
      source: input.source,
      previousState: "running",
      nextState: "shutting_down",
    });

    try {
      const teardownResult = await this.sessionTeardown.execute({
        correlationId,
        operation: "shutdown_cleanup",
      });

      if (!teardownResult.ok) {
        this.logger.warn("shutdown_cleanup_partial_failure", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "shutdown_cleanup",
          result: teardownResult.error.code,
        });
      }

      this.cleanupCompleted = true;

      this.logger.info("shutdown_cleanup_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "shutdown_cleanup",
        source: input.source,
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "shutdown_cleanup_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "shutdown_cleanup",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
