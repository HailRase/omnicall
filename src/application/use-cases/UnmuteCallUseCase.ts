import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

/**
 * - Purpose: unmute media stream for the selected call.
 * - Inputs: call id and optional correlation id.
 * - Outputs: unmuted call snapshot or normalized failure result.
 */
export type UnmuteCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class UnmuteCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: UnmuteCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("unmute_call_requested", {
      correlationId,
      featureId: "F-005",
      boundedContext: "Media",
      operation: "unmute_call",
      previousState: "Active",
      nextState: "Active",
      result: "requested",
    });
    return this.callEngine.unmuteCall({
      callId: input.callId,
      correlationId,
    });
  }
}
