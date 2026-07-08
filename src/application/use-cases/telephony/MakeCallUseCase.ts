import {
  createPhoneNumber,
  validatePhoneNumber,
  type Call,
  type CallId,
} from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

/**
 * - Purpose: validate input number and initiate outgoing call flow.
 * - Inputs: raw phone number, optional correlation id and call id.
 * - Outputs: resulting Call snapshot or validation/operation error.
 */
export type MakeCallInput = Readonly<{
  number: string;
  callId?: CallId;
  correlationId?: CorrelationId;
}>;

export class MakeCallUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: MakeCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const validationErrors = validatePhoneNumber(input.number);

    if (validationErrors.length > 0) {
      this.logger.warn("make_call_rejected", {
        correlationId,
        featureId: "F-003",
        boundedContext: "Telephony",
        operation: "make_call",
        previousState: "Idle",
        nextState: "Idle",
        result: validationErrors.join(","),
      });

      return err(
        createPlatformError(
          "validation_failed",
          "Invalid phone number",
          validationErrors,
        ),
      );
    }

    const callInput =
      input.callId === undefined
        ? {
            correlationId,
            phoneNumber: createPhoneNumber(input.number),
          }
        : {
            callId: input.callId,
            correlationId,
            phoneNumber: createPhoneNumber(input.number),
          };

    return this.callEngine.makeCall(callInput);
  }
}

