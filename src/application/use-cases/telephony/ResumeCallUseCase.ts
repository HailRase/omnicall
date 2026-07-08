import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: restore a held call back to active state.
 * - Inputs: call id and optional correlation id.
 * - Outputs: active call snapshot or normalized failure result.
 */
export type ResumeCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class ResumeCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ResumeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("resume_call_requested", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "resume_call",
      previousState: "Held",
      nextState: "Active",
      result: "requested",
    });
    return this.callEngine.resumeCall({
      callId: input.callId,
      correlationId,
    });
  }
}
