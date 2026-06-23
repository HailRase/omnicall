import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

/**
 * - Purpose: execute blind transfer through CallEngine.
 * - Inputs: call id, target number, optional correlation id.
 * - Outputs: ended call snapshot or normalized failure result.
 */
export type BlindTransferUseCaseInput = Readonly<{
  callId: CallId;
  targetNumber: string;
  correlationId?: CorrelationId;
}>;

export class BlindTransferUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: BlindTransferUseCaseInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("blind_transfer_use_case_requested", {
      correlationId,
      featureId: "F-006",
      boundedContext: "Telephony",
      operation: "blind_transfer",
      previousState: "Active",
      nextState: "Transferring",
      result: "requested",
    });
    return this.callEngine.blindTransfer({
      callId: input.callId,
      targetNumber: input.targetNumber,
      correlationId,
    });
  }
}
