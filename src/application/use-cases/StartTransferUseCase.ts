import type { CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

/**
 * - Purpose: enter transfer mode for an active call through CallEngine.
 * - Inputs: call id and optional correlation id.
 * - Outputs: void result or normalized validation failure.
 */
export type StartTransferUseCaseInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class StartTransferUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  execute(input: StartTransferUseCaseInput): Result<void, ReturnType<typeof createPlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("start_transfer_use_case_requested", {
      correlationId,
      featureId: "F-006",
      boundedContext: "Telephony",
      operation: "start_transfer_mode",
      previousState: "Active",
      nextState: "transfer_mode",
      result: "requested",
    });
    return this.callEngine.startTransferMode({
      callId: input.callId,
      correlationId,
    });
  }
}
