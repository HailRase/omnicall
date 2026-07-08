import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: request call hangup through CallEngine orchestration.
 * - Inputs: call id and optional correlation id.
 * - Outputs: ended call snapshot or normalized failure result.
 */
export type HangupCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class HangupCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: HangupCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("hangup_call_requested", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "hangup_call",
      previousState: "Active",
      nextState: "Ending",
      result: "requested",
    });
    return this.callEngine.hangupCall({
      callId: input.callId,
      correlationId,
    });
  }
}
