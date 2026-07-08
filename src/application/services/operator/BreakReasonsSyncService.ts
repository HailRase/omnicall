import { createBreakReasonsReceivedEvent } from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  SettingsRepository,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";

/**
 * - Purpose: sync OCP break reasons into settings after authentication (LF-078).
 * - Inputs: correlation ID and gateway break reasons query.
 * - Outputs: persisted settings and `BreakReasonsReceived` event.
 */
export class BreakReasonsSyncService {
  constructor(
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async syncAfterOcpAuth(correlationId: CorrelationId): Promise<void> {
    try {
      const reasons = await this.operatorGateway.getBreakReasons({
        correlationId,
      });

      if (reasons.length === 0) {
        return;
      }

      await this.settingsRepository.setAllowedBreakReasons(reasons);
      this.eventPublisher.publish(
        createBreakReasonsReceivedEvent(correlationId, { reasons }),
      );

      this.logger.info("break_reasons_synced", {
        correlationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "sync_break_reasons",
        result: "succeeded",
        reasonCount: reasons.length,
      });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "break_reasons_sync_failed",
        {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "sync_break_reasons",
          result: "error",
        },
        error,
      );
      this.logger.warn("break_reasons_sync_failed_message", {
        correlationId,
        message: normalized.message,
      });
    }
  }
}