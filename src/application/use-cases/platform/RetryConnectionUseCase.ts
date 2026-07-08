import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { ConnectionRecoveryReadModel } from "@ports/operator/ConnectionRecoveryReadModel.js";
import type { SipSessionHealthReadModel } from "@ports/telephony/SipSessionHealthReadModel.js";
import type { Logger } from "@ports/index.js";
import type { ConnectionRecoveryOrchestrationService } from "../../services/recovery/ConnectionRecoveryOrchestrationService.js";
import type { SipRecoveryOrchestrationService } from "../../services/recovery/SipRecoveryOrchestrationService.js";
import {
  isSipManualRetryAvailable,
  isSipRecoveryInProgress,
} from "../../projections/telephony/deriveSipManualRetryGate.js";

const FEATURE_ID = "F-014";

export type RetryConnectionChannel = "sip" | "ocp" | "both";

export type RetryConnectionInput = Readonly<{
  channel: RetryConnectionChannel;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated reconnect after terminal failure (LF-010 OCP path; SIP via settings).
 * - Inputs: target channel and optional correlation id.
 * - Outputs: orchestrates manual retry via recovery service; logs result.
 */
export class RetryConnectionUseCase {
  constructor(
    private readonly sipSessionHealthReadModel: SipSessionHealthReadModel,
    private readonly ocpConnectionRecoveryReadModel: ConnectionRecoveryReadModel,
    private readonly connectionRecoveryOrchestration: ConnectionRecoveryOrchestrationService,
    private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService,
    private readonly logger: Logger,
  ) {}

  async execute(input: RetryConnectionInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    if (input.channel === "sip" || input.channel === "both") {
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
    }

    if (input.channel === "ocp" || input.channel === "both") {
      const ocpSnapshot = this.ocpConnectionRecoveryReadModel.getSnapshot();
      if (ocpSnapshot.connectionState === "reconnecting") {
        return err(
          createPlatformError("operation_failed", "Automatic reconnect in progress", {
            reason: "reconnecting",
          }),
        );
      }
      if (
        ocpSnapshot.connectionState !== "manual_retry_available" &&
        ocpSnapshot.connectionState !== "ocp_disconnected"
      ) {
        return err(
          createPlatformError("operation_failed", "Manual retry not available", {
            reason: "manual_retry_unavailable",
            connectionState: ocpSnapshot.connectionState,
          }),
        );
      }
      if (!ocpSnapshot.isOcpMode) {
        return err(
          createPlatformError("operation_failed", "OCP mode is not enabled", {
            reason: "ocp_not_enabled",
          }),
        );
      }
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
      if (input.channel === "sip") {
        await this.sipRecoveryOrchestration.requestManualTransportReconnect(correlationId);
      } else if (input.channel === "both") {
        await this.sipRecoveryOrchestration.requestManualTransportReconnect(correlationId);
        await this.connectionRecoveryOrchestration.requestManualRetry("ocp", correlationId);
      } else {
        await this.connectionRecoveryOrchestration.requestManualRetry(
          input.channel,
          correlationId,
        );
      }

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
