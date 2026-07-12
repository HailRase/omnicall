import type { Call, CallId, CallMediaMode } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: request answering a ringing call through CallEngine.
 * - Inputs: call id, optional correlation id and media mode.
 * - Outputs: answered Call snapshot or operation error.
 */
export type AnswerCallInput = Readonly<{
  callId: CallId;
  mediaMode?: CallMediaMode;
  correlationId?: CorrelationId;
}>;

export class AnswerCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: AnswerCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("incoming_answer_requested", {
      correlationId,
      featureId: "F-002",
      boundedContext: "Telephony",
      operation: "answer_call",
      previousState: "Ringing",
      nextState: "Active",
      result: "requested",
    });
    return this.callEngine.answerCall({
      callId: input.callId,
      correlationId,
      ...(input.mediaMode !== undefined ? { mediaMode: input.mediaMode } : {}),
    });
  }
}
