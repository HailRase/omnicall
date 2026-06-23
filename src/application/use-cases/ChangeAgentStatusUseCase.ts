import {
  createAgentStatusChangeRejectedEvent,
  createAgentStatusChangeRequestedEvent,
  createAgentStatusChangedEvent,
  isAgentStatus,
  type AgentStatus,
  type AgentStatusRejectionReason,
  type StatusReason,
} from "@domain/index.js";
import { AgentStatusValidationService } from "../services/AgentStatusValidationService.js";
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

export type ChangeAgentStatusTrigger = "user" | "phone_dnd";

export type ChangeAgentStatusInput = Readonly<{
  targetStatus: AgentStatus;
  reason?: StatusReason | null;
  correlationId?: CorrelationId;
  trigger?: ChangeAgentStatusTrigger;
}>;

export class ChangeAgentStatusUseCase {
  private readonly validationService = new AgentStatusValidationService();

  constructor(
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: ChangeAgentStatusInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const trigger = input.trigger ?? "user";

    if (!isAgentStatus(input.targetStatus)) {
      return err(
        createPlatformError("validation_failed", "Invalid agent status"),
      );
    }

    const snapshot = this.agentStatusReadModel.getSnapshot();
    const previousStatus = snapshot.currentStatus;
    const reason = input.reason ?? null;

    if (!snapshot.isOcpStatusAvailable) {
      return this.rejectAndReturn(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason: "ocp_not_connected",
        trigger,
      });
    }

    if (previousStatus === null) {
      return this.rejectAndReturn(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason: "invalid_transition",
        trigger,
      });
    }

    const incomingSettings = await this.settingsRepository.getIncomingCallSettings();
    const validation = this.validationService.validateTransition(
      previousStatus,
      input.targetStatus,
      {
        phoneStatus: await this.settingsRepository.getPhoneStatus(),
        breakReasonRequired: incomingSettings.rejectReasonRequired,
        reason,
      },
    );

    if (!validation.ok) {
      return this.rejectAndReturn(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason: validation.reason,
        trigger,
      });
    }

    this.eventPublisher.publish(
      createAgentStatusChangeRequestedEvent(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason,
      }),
    );

    this.logger.info("agent_status_change_requested", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "change_agent_status",
      previousState: previousStatus ?? "none",
      nextState: input.targetStatus,
      trigger,
      result: "requested",
    });

    try {
      const gatewayResult = await this.operatorGateway.changeAgentStatus({
        targetStatus: input.targetStatus,
        reason,
        correlationId,
      });

      if (gatewayResult.status === "failed") {
        const rejectionReason = mapGatewayFailureReason(gatewayResult.reason);
        return this.rejectAndReturn(correlationId, {
          previousStatus,
          targetStatus: input.targetStatus,
          reason: rejectionReason,
          trigger,
          gatewayMessage: gatewayResult.message,
        });
      }

      const changedAt = new Date().toISOString();
      this.eventPublisher.publish(
        createAgentStatusChangedEvent(correlationId, {
          previousStatus,
          currentStatus: gatewayResult.currentStatus,
          reason,
          changedAt,
        }),
      );

      this.logger.info("agent_status_changed", {
        correlationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "change_agent_status",
        previousState: previousStatus,
        nextState: gatewayResult.currentStatus,
        trigger,
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      return this.rejectAndReturn(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason: "gateway_failed",
        trigger,
        gatewayMessage: normalized.message,
        error,
      });
    }
  }

  private rejectAndReturn(
    correlationId: CorrelationId,
    params: Readonly<{
      previousStatus: AgentStatus | null;
      targetStatus: AgentStatus;
      reason: AgentStatusRejectionReason;
      trigger: ChangeAgentStatusTrigger;
      gatewayMessage?: string;
      error?: unknown;
    }>,
  ): Result<void, PlatformError> {
    this.eventPublisher.publish(
      createAgentStatusChangeRejectedEvent(correlationId, {
        previousStatus: params.previousStatus,
        targetStatus: params.targetStatus,
        reason: params.reason,
      }),
    );

    const logPayload = {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "change_agent_status",
      previousState: params.previousStatus ?? "none",
      nextState: params.targetStatus,
      trigger: params.trigger,
      result: params.reason,
      gatewayMessage: params.gatewayMessage,
    };

    if (params.error !== undefined) {
      this.logger.error("agent_status_change_rejected", logPayload, params.error);
    } else {
      this.logger.warn("agent_status_change_rejected", logPayload);
    }

    return err(
      createPlatformError(
        "operation_failed",
        params.gatewayMessage ?? params.reason,
        { reason: params.reason },
      ),
    );
  }
}

function mapGatewayFailureReason(gatewayReason: string): AgentStatusRejectionReason {
  if (gatewayReason === "network_error") {
    return "network_error";
  }
  if (gatewayReason === "ocp_not_connected") {
    return "ocp_not_connected";
  }
  return "gateway_failed";
}
