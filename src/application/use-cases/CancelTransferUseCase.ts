import type { CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

/**
 * - Purpose: cancel transfer mode and consultation without invalid terminal state.
 * - Inputs: call id and optional correlation id.
 * - Outputs: void result or normalized validation failure.
 */
export type CancelTransferUseCaseInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class CancelTransferUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: CancelTransferUseCaseInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("cancel_transfer_use_case_requested", {
      correlationId,
      featureId: "F-006",
      boundedContext: "Telephony",
      operation: "cancel_transfer_mode",
      previousState: "transfer_mode",
      nextState: "Active",
      result: "requested",
    });
    return this.callEngine.cancelTransfer({
      callId: input.callId,
      correlationId,
    });
  }
}
