import {
  createAgentStatusChangedEvent,
  createPostCallStatusUpdatedEvent,
  createBreakReason,
  createStatusReason,
  validateBreakReason,
  type AgentStatus,
  type CallId,
} from "@domain/index.js";
import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  SettingsRepository,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type UpdatePostCallStatusInput = Readonly<{
  callId: CallId;
  breakReason?: string;
  correlationId?: CorrelationId;
}>;

const POST_CALL_STATUS: AgentStatus = "post_call";

export class UpdatePostCallStatusUseCase {
  constructor(
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: UpdatePostCallStatusInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const snapshot = this.agentStatusReadModel.getSnapshot();

    if (!snapshot.isOcpStatusAvailable) {
      return ok(undefined);
    }

    const incomingSettings = await this.settingsRepository.getIncomingCallSettings();
    const breakReasonRaw = input.breakReason?.trim() ?? "";
    let reason = null;

    if (incomingSettings.allowedBreakReasons.length > 0) {
      const validationErrors = validateBreakReason(
        breakReasonRaw,
        incomingSettings.allowedBreakReasons,
      );
      if (validationErrors.length > 0) {
        return err(
          createPlatformError(
            "validation_failed",
            "Invalid post-call break reason",
            validationErrors,
          ),
        );
      }
      if (breakReasonRaw.length > 0) {
        reason = createBreakReason(breakReasonRaw);
      }
    }

    this.logger.info("post_call_status_update_requested", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "update_post_call_status",
      previousState: snapshot.currentStatus ?? "none",
      nextState: POST_CALL_STATUS,
      result: "requested",
    });

    try {
      const gatewayResult = await this.operatorGateway.updatePostCallStatus({
        callId: input.callId,
        postCallStatus: POST_CALL_STATUS,
        reason,
        correlationId,
      });

      if (gatewayResult.status === "failed") {
        this.logger.warn("post_call_status_update_failed", {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "update_post_call_status",
          result: gatewayResult.reason,
          gatewayMessage: gatewayResult.message,
        });
        return err(
          createPlatformError(
            "operation_failed",
            gatewayResult.message,
            { reason: gatewayResult.reason },
          ),
        );
      }

      const updatedAt = new Date().toISOString();
      const previousStatus = snapshot.currentStatus;

      this.eventPublisher.publish(
        createPostCallStatusUpdatedEvent(correlationId, {
          callId: input.callId,
          postCallStatus: gatewayResult.postCallStatus,
          reason,
          updatedAt,
        }),
      );

      this.eventPublisher.publish(
        createAgentStatusChangedEvent(correlationId, {
          previousStatus,
          currentStatus: gatewayResult.postCallStatus,
          reason: reason === null ? null : createStatusReason(reason),
          changedAt: updatedAt,
        }),
      );

      this.logger.info("post_call_status_updated", {
        correlationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "update_post_call_status",
        previousState: previousStatus ?? "none",
        nextState: gatewayResult.postCallStatus,
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "post_call_status_update_failed",
        {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "update_post_call_status",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
