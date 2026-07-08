import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: start attended-transfer consultation leg through CallEngine.
 * - Inputs: source call id, target number, optional consultation call id.
 * - Outputs: active consultation call or normalized failure result.
 */
export type StartConsultationUseCaseInput = Readonly<{
  sourceCallId: CallId;
  targetNumber: string;
  consultationCallId?: CallId;
  correlationId?: CorrelationId;
}>;

export class StartConsultationUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: StartConsultationUseCaseInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("start_consultation_use_case_requested", {
      correlationId,
      featureId: "F-007",
      boundedContext: "Telephony",
      operation: "start_consultation",
      previousState: "Active",
      nextState: "consultation_dialing",
      result: "requested",
    });
    return this.callEngine.startConsultation({
      sourceCallId: input.sourceCallId,
      targetNumber: input.targetNumber,
      ...(input.consultationCallId !== undefined
        ? { consultationCallId: input.consultationCallId }
        : {}),
      correlationId,
    });
  }
}
