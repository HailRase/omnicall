import type { Call, CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: move an active call into held state via CallEngine.
 * - Inputs: call id and optional correlation id.
 * - Outputs: held call snapshot or normalized failure result.
 */
export type HoldCallInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class HoldCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: HoldCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    this.logger.info("hold_call_requested", {
      correlationId,
      featureId: "F-004",
      boundedContext: "Telephony",
      operation: "hold_call",
      previousState: "Active",
      nextState: "Held",
      result: "requested",
    });
    return this.callEngine.holdCall({
      callId: input.callId,
      correlationId,
    });
  }
}
