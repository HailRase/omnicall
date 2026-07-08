import {
  createCallHistoryDeletedEvent,
  createCallHistoryEntryId,
} from "@domain/index.js";
import type { CallHistoryRepository, DomainEventPublisher, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type DeleteCallHistoryEntryInput = Readonly<{
  entryId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: remove one persisted call history row by id.
 * - Inputs: call history entry id string.
 * - Outputs: void result and CallHistoryDeleted event publication.
 */
export class DeleteCallHistoryEntryUseCase {
  constructor(
    private readonly callHistoryRepository: CallHistoryRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: DeleteCallHistoryEntryInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const entryId = createCallHistoryEntryId(input.entryId);
    if (entryId === null) {
      return err(createPlatformError("validation_failed", "Invalid call history entry id"));
    }

    const deleted = await this.callHistoryRepository.deleteEntry(entryId);
    if (!deleted) {
      this.logger.warn("call_history_delete_not_found", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "delete_call_history_entry",
        entryId: input.entryId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Call history entry was not found"));
    }

    this.eventPublisher.publish(createCallHistoryDeletedEvent(correlationId, entryId));

    this.logger.info("call_history_entry_deleted", {
      correlationId,
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "delete_call_history_entry",
      entryId,
      result: "succeeded",
    });

    return ok(undefined);
  }
}
