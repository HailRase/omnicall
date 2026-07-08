import {
  createDtmfTone,
  type CallId,
  validateDtmfTone,
} from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: validate DTMF tone and send it through CallEngine.
 * - Inputs: active call id, tone candidate, optional correlation id.
 * - Outputs: success signal or normalized validation/operation error.
 */
export type SendDtmfInput = Readonly<{
  callId: CallId;
  tone: string;
  correlationId?: CorrelationId;
}>;

export class SendDtmfUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: SendDtmfInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const validationErrors = validateDtmfTone(input.tone);
    if (validationErrors.length > 0) {
      this.logger.warn("send_dtmf_rejected", {
        correlationId,
        featureId: "F-008",
        boundedContext: "Telephony",
        operation: "send_dtmf",
        previousState: "Active",
        nextState: "Active",
        result: validationErrors.join(","),
      });

      return err(
        createPlatformError("validation_failed", "Invalid DTMF tone", validationErrors),
      );
    }

    return this.callEngine.sendDtmf({
      callId: input.callId,
      correlationId,
      tone: createDtmfTone(input.tone),
    });
  }
}

