import {
  createCallHistoryEntryId,
  type Call,
} from "@domain/index.js";
import type { CallHistoryRepository, Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { MakeCallUseCase } from "../telephony/MakeCallUseCase.js";

export type RedialFromHistoryInput = Readonly<{
  entryId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: initiate outgoing call from a persisted history entry.
 * - Inputs: call history entry id.
 * - Outputs: resulting Call snapshot via MakeCallUseCase.
 */
export class RedialFromHistoryUseCase {
  constructor(
    private readonly callHistoryRepository: CallHistoryRepository,
    private readonly makeCallUseCase: MakeCallUseCase,
    private readonly logger: Logger,
  ) {}

  async execute(input: RedialFromHistoryInput): Promise<Result<Call, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const entryId = createCallHistoryEntryId(input.entryId);
    if (entryId === null) {
      return err(createPlatformError("validation_failed", "Invalid call history entry id"));
    }

    const entry = await this.callHistoryRepository.getEntryById(entryId);
    if (entry === null) {
      this.logger.warn("call_history_redial_not_found", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "redial_from_history",
        entryId: input.entryId,
        result: "not_found",
      });
      return err(createPlatformError("not_found", "Call history entry was not found"));
    }

    const result = await this.makeCallUseCase.execute({
      number: entry.remoteNumber,
      correlationId,
    });

    if (isErr(result)) {
      this.logger.warn("call_history_redial_failed", {
        correlationId,
        featureId: "F-013",
        boundedContext: "Settings",
        operation: "redial_from_history",
        entryId: entry.id,
        result: result.error.code,
      });
      return result;
    }

    this.logger.info("call_history_redial_started", {
      correlationId,
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "redial_from_history",
      entryId: entry.id,
      result: "succeeded",
    });

    return ok(result.value);
  }
}
