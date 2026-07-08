import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SipSessionHealthReadModel } from "@ports/telephony/SipSessionHealthReadModel.js";
import type { Logger } from "@ports/index.js";
import type { SipRecoveryOrchestrationService } from "../../services/recovery/SipRecoveryOrchestrationService.js";
import {
  isSipManualRetryAvailable,
  isSipRecoveryInProgress,
} from "../../projections/telephony/deriveSipManualRetryGate.js";

const FEATURE_ID = "F-014";

export type RetryConnectionChannel = "sip";

export type RetryConnectionInput = Readonly<{
  channel: RetryConnectionChannel;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated SIP reconnect after terminal failure (LF-008).
 * - Inputs: SIP channel and optional correlation id.
 * - Outputs: orchestrates manual retry via SIP recovery service; logs result.
 */
export class RetryConnectionUseCase {
  constructor(
    private readonly sipSessionHealthReadModel: SipSessionHealthReadModel,
    private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService,
    private readonly logger: Logger,
  ) {}

  async execute(input: RetryConnectionInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    const sipHealth = this.sipSessionHealthReadModel.getSnapshot();
    if (isSipRecoveryInProgress(sipHealth)) {
      return err(
        createPlatformError("operation_failed", "Automatic reconnect in progress", {
          reason: "reconnecting",
        }),
      );
    }
    if (!isSipManualRetryAvailable(sipHealth)) {
      return err(
        createPlatformError("operation_failed", "Manual retry not available", {
          reason: "manual_retry_unavailable",
        }),
      );
    }

    this.logger.info("retry_connection_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "retry_connection",
      channel: input.channel,
      attemptNumber: 1,
      result: "requested",
    });

    try {
      await this.sipRecoveryOrchestration.requestManualTransportReconnect(correlationId);

      this.logger.info("retry_connection_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "retry_connection",
        channel: input.channel,
        attemptNumber: 1,
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Manual retry failed";
      this.logger.error("retry_connection_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "retry_connection",
        channel: input.channel,
        attemptNumber: 1,
        result: "error",
        reason: message,
      });
      return err(createPlatformError("operation_failed", message));
    }
  }
}
