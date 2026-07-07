import type { CallHistoryEntry } from "@domain/index.js";
import type { CallHistoryRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type ListCallHistoryInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: load persisted call history entries for renderer projection.
 * - Inputs: optional correlation id for observability.
 * - Outputs: newest-first call history entries.
 */
export class ListCallHistoryUseCase {
  constructor(
    private readonly callHistoryRepository: CallHistoryRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ListCallHistoryInput = {},
  ): Promise<Result<ReadonlyArray<CallHistoryEntry>, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const entries = await this.callHistoryRepository.listEntries();

    this.logger.info("call_history_listed", {
      correlationId,
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "list_call_history",
      result: "succeeded",
      count: entries.length,
    });

    return ok(entries);
  }
}
