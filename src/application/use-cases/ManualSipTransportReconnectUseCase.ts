import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { Logger } from "@ports/index.js";
import type { SipRecoveryOrchestrationService } from "../services/SipRecoveryOrchestrationService.js";

const FEATURE_ID = "F-014";

export type ManualSipTransportReconnectInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated SIP socket reconnect from settings (ADR-0004 §1.6).
 * - Inputs: optional correlation id.
 * - Outputs: schedules manual transport reconnect via orchestration service.
 */
export class ManualSipTransportReconnectUseCase {
  constructor(
    private readonly sipRecoveryOrchestration: SipRecoveryOrchestrationService,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ManualSipTransportReconnectInput = {},
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.logger.info("manual_sip_transport_reconnect_requested", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "manual_sip_transport_reconnect",
    });

    try {
      await this.sipRecoveryOrchestration.requestManualTransportReconnect(correlationId);

      this.logger.info("manual_sip_transport_reconnect_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "manual_sip_transport_reconnect",
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Manual SIP transport reconnect failed";
      this.logger.error("manual_sip_transport_reconnect_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "manual_sip_transport_reconnect",
        result: "error",
        reason: message,
      });
      return err(createPlatformError("operation_failed", message));
    }
  }
}
