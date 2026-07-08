import { createCallHistoryEntryId, type CallHistoryEntry } from "@domain/index.js";
import type { CallHistoryRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type GetCallHistoryEntryInput = Readonly<{
  entryId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: load one persisted call history entry by id.
 * - Inputs: call history entry id string.
 * - Outputs: CallHistoryEntry snapshot or not_found/validation error.
 */
export class GetCallHistoryEntryUseCase {
  constructor(
    private readonly callHistoryRepository: CallHistoryRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: GetCallHistoryEntryInput,
  ): Promise<Result<CallHistoryEntry, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const entryId = createCallHistoryEntryId(input.entryId);
    if (entryId === null) {
      return err(createPlatformError("validation_failed", "Invalid call history entry id"));
    }

    const entry = await this.callHistoryRepository.getEntryById(entryId);
    if (entry === null) {
      this.logger.warn("call_history_entry_not_found", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "get_call_history_entry",
        entryId: input.entryId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Call history entry was not found"));
    }

    this.logger.info("call_history_entry_loaded", {
      correlationId,
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "get_call_history_entry",
      entryId: entry.id,
      result: "succeeded",
    });

    return ok(entry);
  }
}
