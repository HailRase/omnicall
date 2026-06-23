import {
  canRequestDlgStop,
  createDlgStopRequestedEvent,
  createDlgStopSentEvent,
  initialDlgStopPolicyState,
  markDlgStopSent,
  type CallId,
  type DlgStopPolicyState,
  type DlgStopTrigger,
  type MainAcallId,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OcpSyncGateway,
  OcpSyncReadModel,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type SendDlgStopInput = Readonly<{
  callId: CallId;
  mainAcallId: MainAcallId | null;
  trigger: DlgStopTrigger;
  correlationId?: CorrelationId;
}>;

export type SendDlgStopOutcome =
  | Readonly<{ status: "skipped"; reason: "sip_only" | "no_correlation" | "duplicate" }>
  | Readonly<{ status: "succeeded" }>;

/**
 * - Purpose: send dlg_stop exactly once per call when OCP correlation exists (LF-064).
 * - Inputs: callId, mainAcallId, trigger, correlationId.
 * - Outputs: DlgStopRequested then gateway confirm then DlgStopSent.
 */
export class SendDlgStopUseCase {
  private policyState: DlgStopPolicyState = initialDlgStopPolicyState();

  constructor(
    private readonly ocpSyncGateway: OcpSyncGateway,
    private readonly ocpSyncReadModel: OcpSyncReadModel,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: SendDlgStopInput,
  ): Promise<Result<SendDlgStopOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const snapshot = this.ocpSyncReadModel.getSnapshot();

    if (!snapshot.isOcpSyncAvailable) {
      return ok({ status: "skipped", reason: "sip_only" });
    }

    if (input.mainAcallId === null) {
      return ok({ status: "skipped", reason: "no_correlation" });
    }

    if (!canRequestDlgStop(this.policyState, input.callId)) {
      this.logger.info("dlg_stop_duplicate_blocked", {
        correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "send_dlg_stop",
        callId: input.callId,
        trigger: input.trigger,
        result: "duplicate_blocked",
      });
      return ok({ status: "skipped", reason: "duplicate" });
    }

    this.eventPublisher.publish(
      createDlgStopRequestedEvent(correlationId, {
        callId: input.callId,
        mainAcallId: input.mainAcallId,
        trigger: input.trigger,
      }),
    );

    this.logger.info("dlg_stop_requested", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "send_dlg_stop",
      callId: input.callId,
      mainAcallId: input.mainAcallId,
      trigger: input.trigger,
      result: "requested",
    });

    try {
      const gatewayResult = await this.ocpSyncGateway.sendDlgStop({
        callId: input.callId,
        mainAcallId: input.mainAcallId,
        correlationId,
      });

      if (gatewayResult.status === "failed") {
        this.logger.warn("dlg_stop_failed", {
          correlationId,
          featureId: "F-015",
          boundedContext: "Operator",
          operation: "send_dlg_stop",
          callId: input.callId,
          trigger: input.trigger,
          result: gatewayResult.reason,
          gatewayMessage: gatewayResult.message,
        });
        return err(
          createPlatformError("operation_failed", gatewayResult.message, {
            reason: gatewayResult.reason,
          }),
        );
      }

      this.policyState = markDlgStopSent(this.policyState, input.callId);
      this.eventPublisher.publish(
        createDlgStopSentEvent(correlationId, {
          callId: input.callId,
          mainAcallId: input.mainAcallId,
          trigger: input.trigger,
        }),
      );

      this.logger.info("dlg_stop_succeeded", {
        correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "send_dlg_stop",
        callId: input.callId,
        mainAcallId: input.mainAcallId,
        trigger: input.trigger,
        result: "succeeded",
      });

      return ok({ status: "succeeded" });
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "dlg_stop_failed",
        {
          correlationId,
          featureId: "F-015",
          boundedContext: "Operator",
          operation: "send_dlg_stop",
          callId: input.callId,
          trigger: input.trigger,
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
