import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { ConnectionRecoveryReadModel } from "@ports/operator/ConnectionRecoveryReadModel.js";
import type { Logger } from "@ports/index.js";
import type { ConnectionRecoveryOrchestrationService } from "../services/ConnectionRecoveryOrchestrationService.js";

const FEATURE_ID = "F-014";

export type RetryConnectionChannel = "sip" | "ocp" | "both";

export type RetryConnectionInput = Readonly<{
  channel: RetryConnectionChannel;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated reconnect after terminal failure (LF-009, LF-010).
 * - Inputs: target channel and optional correlation id.
 * - Outputs: orchestrates manual retry via recovery service; logs result.
 */
export class RetryConnectionUseCase {
  constructor(
    private readonly connectionRecoveryReadModel: ConnectionRecoveryReadModel,
    private readonly connectionRecoveryOrchestration: ConnectionRecoveryOrchestrationService,
    private readonly logger: Logger,
  ) {}

  async execute(input: RetryConnectionInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const snapshot = this.connectionRecoveryReadModel.getSnapshot();

    if (snapshot.connectionState === "reconnecting") {
      return err(
        createPlatformError("operation_failed", "Automatic reconnect in progress", {
          reason: "reconnecting",
        }),
      );
    }

    if (
      snapshot.connectionState !== "manual_retry_available" &&
      snapshot.connectionState !== "reconnect_failed" &&
      snapshot.connectionState !== "sip_registration_failed"
    ) {
      return err(
        createPlatformError("operation_failed", "Manual retry not available", {
          reason: "manual_retry_unavailable",
          connectionState: snapshot.connectionState,
        }),
      );
    }

    if (input.channel === "ocp" && !snapshot.isOcpMode) {
      return err(
        createPlatformError("operation_failed", "OCP mode is not enabled", {
          reason: "ocp_not_enabled",
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
      previousState: snapshot.connectionState,
      nextState: "reconnecting",
    });

    try {
      await this.connectionRecoveryOrchestration.requestManualRetry(
        input.channel,
        correlationId,
      );

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
