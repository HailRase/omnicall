import {
  createAgentStatusChangeRejectedEvent,
  createAgentStatusChangeRequestedEvent,
  createAgentStatusChangedEvent,
  createStatusReason,
  isAgentBreakReasonRequired,
  isAgentStatus,
  validateBreakReason,
  type AgentStatus,
  type AgentStatusRejectionReason,
  type StatusReason,
} from "@domain/index.js";
import { AgentStatusValidationService } from "../../services/operator/AgentStatusValidationService.js";
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
  breakReason?: string;
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
    const allowedBreakReasons = incomingSettings.allowedBreakReasons;
    const breakReasonRequired = isAgentBreakReasonRequired(
      input.targetStatus,
      allowedBreakReasons,
      trigger,
    );

    const statusReason = resolveBreakStatusReason(
      input.targetStatus,
      input.breakReason,
      allowedBreakReasons,
      breakReasonRequired,
    );

    if (statusReason.rejectionReason !== null) {
      return this.rejectAndReturn(correlationId, {
        previousStatus,
        targetStatus: input.targetStatus,
        reason: statusReason.rejectionReason,
        trigger,
      });
    }

    const validation = this.validationService.validateTransition(
      previousStatus,
      input.targetStatus,
      {
        phoneStatus: await this.settingsRepository.getPhoneStatus(),
        breakReasonRequired,
        reason: statusReason.value,
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
        reason: statusReason.value,
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
        reason: statusReason.value,
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
          reason: statusReason.value,
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

function resolveBreakStatusReason(
  targetStatus: AgentStatus,
  breakReason: string | undefined,
  allowedBreakReasons: ReadonlyArray<string>,
  breakReasonRequired: boolean,
): Readonly<{
  value: StatusReason | null;
  rejectionReason: AgentStatusRejectionReason | null;
}> {
  if (targetStatus !== "break") {
    return { value: null, rejectionReason: null };
  }

  if (!breakReasonRequired) {
    const trimmed = breakReason?.trim() ?? "";
    if (trimmed.length === 0) {
      return { value: null, rejectionReason: null };
    }
    return { value: createStatusReason(trimmed), rejectionReason: null };
  }

  const validationErrors = validateBreakReason(
    breakReason ?? "",
    allowedBreakReasons,
  );
  if (validationErrors.includes("break_reason_required")) {
    return { value: null, rejectionReason: "break_reason_required" };
  }
  if (validationErrors.includes("break_reason_not_allowed")) {
    return { value: null, rejectionReason: "break_reason_required" };
  }

  return {
    value: createStatusReason(breakReason ?? ""),
    rejectionReason: null,
  };
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
