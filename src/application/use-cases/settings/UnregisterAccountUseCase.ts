import {
  createUnregistrationFailedEvent,
  createUnregistrationRequestedEvent,
  createUnregistrationSucceededEvent,
} from "@domain/index.js";
import type { DomainEventPublisher, Logger, TelephonyGateway } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const FEATURE_ID = "F-001";

export type UnregisterAccountInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: SIP account unregistration through TelephonyGateway (F-001).
 * - Inputs: optional correlation id.
 * - Outputs: unregistration domain events and gateway unregister result.
 */
export class UnregisterAccountUseCase {
  constructor(
    private readonly telephonyGateway: TelephonyGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: UnregisterAccountInput = {},
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(createUnregistrationRequestedEvent(correlationId));

    this.logger.info("unregistration_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "unregister_account",
      previousState: "registered",
      nextState: "unregistering",
    });

    try {
      const gatewayResult = await this.telephonyGateway.unregister(correlationId);

      if (isErr(gatewayResult)) {
        this.eventPublisher.publish(
          createUnregistrationFailedEvent(correlationId, {
            reason: gatewayResult.error.message,
          }),
        );

        this.logger.error("unregistration_failed", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "unregister_account",
          result: gatewayResult.error.code,
        });

        return gatewayResult;
      }

      this.eventPublisher.publish(createUnregistrationSucceededEvent(correlationId));

      this.logger.info("unregistration_succeeded", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "unregister_account",
        previousState: "registered",
        nextState: "idle",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);

      this.eventPublisher.publish(
        createUnregistrationFailedEvent(correlationId, {
          reason: normalized.message,
        }),
      );

      this.logger.error(
        "unregistration_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "unregister_account",
          result: "error",
        },
        error,
      );

      return err(normalized);
    }
  }
}
