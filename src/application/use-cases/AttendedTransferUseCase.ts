import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

/**
 * - Purpose: complete attended transfer through CallEngine.
 * - Inputs: source call id, consultation call id, optional correlation id.
 * - Outputs: ended source call snapshot or normalized failure result.
 */
export type AttendedTransferUseCaseInput = Readonly<{
  sourceCallId: CallId;
  consultationCallId: CallId;
  correlationId?: CorrelationId;
}>;

export class AttendedTransferUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: AttendedTransferUseCaseInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("attended_transfer_use_case_requested", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "attended_transfer",
      previousState: "consultation_active",
      nextState: "attended_transfer_in_progress",
      result: "requested",
    });
    return this.callEngine.attendedTransfer({
      sourceCallId: input.sourceCallId,
      consultationCallId: input.consultationCallId,
      correlationId,
    });
  }
}
