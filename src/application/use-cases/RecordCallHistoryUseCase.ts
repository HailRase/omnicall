import {
  createCallHistoryEntryFromSession,
  createCallHistoryRecordedEvent,
  type CallHistoryEntry,
  type CallHistorySessionSnapshot,
} from "@domain/index.js";
import type { CallHistoryRepository, DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";

export type RecordCallHistoryInput = Readonly<{
  snapshot: CallHistorySessionSnapshot;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: persist one call history row from a finalized session snapshot.
 * - Inputs: tracked call session snapshot at end of call.
 * - Outputs: stored entry and CallHistoryRecorded event publication.
 */
export class RecordCallHistoryUseCase {
  constructor(
    private readonly callHistoryRepository: CallHistoryRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: RecordCallHistoryInput,
  ): Promise<Result<CallHistoryEntry, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const created = createCallHistoryEntryFromSession(input.snapshot);
    if (!created.ok) {
      this.logger.warn("call_history_record_rejected", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "record_call_history",
        callId: input.snapshot.callId,
        result: created.errors.join(","),
      });
      return err(
        createPlatformError(
          "validation_failed",
          "Call history entry validation failed",
          created.errors,
        ),
      );
    }

    try {
      await this.callHistoryRepository.appendEntry(created.value);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error("call_history_persist_failed", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "record_call_history",
        callId: input.snapshot.callId,
        result: normalized.code,
      });
      return err(normalized);
    }

    this.eventPublisher.publish(
      createCallHistoryRecordedEvent(correlationId, created.value),
    );

    this.logger.info("call_history_recorded", {
      correlationId,
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "record_call_history",
      callId: created.value.callId,
      result: "succeeded",
      outcome: created.value.outcome,
    });

    return ok(created.value);
  }
}
