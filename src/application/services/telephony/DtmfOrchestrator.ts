import { createDtmfFailedEvent, createDtmfSentEvent } from "@domain/index.js";
import type { DomainEventPublisher, Logger, TelephonyGateway } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok, type Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { SendDtmfInput } from "./callEngineTypes.js";

type DtmfOrchestratorDeps = Readonly<{
  telephonyGateway: TelephonyGateway;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
}>;

/**
 * - Purpose: orchestrate DTMF send operations through telephony gateway.
 * - Inputs: call id, tone, optional correlation id.
 * - Outputs: success void or normalized platform error with domain events.
 */
export class DtmfOrchestrator {
  constructor(private readonly deps: DtmfOrchestratorDeps) {}

  async sendDtmf(
    input: SendDtmfInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    try {
      const gatewayResult = await this.deps.telephonyGateway.sendDtmf({
        callId: input.callId,
        tone: input.tone,
        correlationId,
      });

      if (isErr(gatewayResult)) {
        this.deps.eventPublisher.publish(
          createDtmfFailedEvent(correlationId, {
            callId: input.callId,
            tone: input.tone,
            reason: gatewayResult.error.message,
          }),
        );

        this.deps.logger.error("dtmf_failed", {
          correlationId,
          featureId: "F-008",
          boundedContext: "Telephony",
          operation: "send_dtmf",
          previousState: "Active",
          nextState: "Active",
          result: gatewayResult.error.code,
        });

        return gatewayResult;
      }

      this.deps.eventPublisher.publish(
        createDtmfSentEvent(correlationId, {
          callId: input.callId,
          tone: input.tone,
        }),
      );

      this.deps.logger.info("dtmf_sent", {
        correlationId,
        featureId: "F-008",
        boundedContext: "Telephony",
        operation: "send_dtmf",
        previousState: "Active",
        nextState: "Active",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.deps.eventPublisher.publish(
        createDtmfFailedEvent(correlationId, {
          callId: input.callId,
          tone: input.tone,
          reason: normalized.message,
        }),
      );
      this.deps.logger.error("dtmf_failed", {
        correlationId,
        featureId: "F-008",
        boundedContext: "Telephony",
        operation: "send_dtmf",
        previousState: "Active",
        nextState: "Active",
        result: normalized.code,
        normalizedError: normalized.message,
      });
      return err(normalized);
    }
  }
}
