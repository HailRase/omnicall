import type { Call, CallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/CallEngine.js";

export type RejectIncomingCallByDndInput = Readonly<{
  callId: CallId;
  correlationId?: CorrelationId;
}>;

export class RejectIncomingCallByDndUseCase {
  constructor(private readonly callEngine: CallEngine) {}

  execute(
    input: RejectIncomingCallByDndInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.callEngine.rejectCall({
      callId: input.callId,
      correlationId: input.correlationId ?? createCorrelationId(),
      sipCode: 486,
    });
  }
}
