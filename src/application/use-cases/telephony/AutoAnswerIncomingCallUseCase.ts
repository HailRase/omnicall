import type { Call, CallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

export type AutoAnswerIncomingCallInput = Readonly<{
  callId: CallId;
  timeoutSec: number;
  correlationId?: CorrelationId;
}>;

export class AutoAnswerIncomingCallUseCase {
  constructor(private readonly callEngine: CallEngine) {}

  execute(
    input: AutoAnswerIncomingCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.callEngine.answerCall({
      callId: input.callId,
      correlationId: input.correlationId ?? createCorrelationId(),
      autoAnswered: true,
      timeoutSec: input.timeoutSec,
    });
  }
}
