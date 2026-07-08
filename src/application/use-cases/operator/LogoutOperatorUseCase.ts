import {
  createAgentLogoutRequestedEvent,
  createStatusReason,
  validateBreakReason,
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

export type LogoutOperatorInput = Readonly<{
  reason?: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: request operator logout with optional reason validation (LF-047).
 * - Inputs: optional logout reason string and correlation id.
 * - Outputs: publishes AgentLogoutRequested and calls gateway requestLogout.
 */
export class LogoutOperatorUseCase {
  constructor(
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly settingsRepository: SettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: LogoutOperatorInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const snapshot = this.agentStatusReadModel.getSnapshot();

    if (!snapshot.isOcpStatusAvailable) {
      return err(
        createPlatformError("operation_failed", "ocp_not_connected", {
          reason: "ocp_not_connected",
        }),
      );
    }

    const incomingSettings = await this.settingsRepository.getIncomingCallSettings();
    const reasonRaw = input.reason?.trim() ?? "";
    const logoutReasonRequired = incomingSettings.allowedBreakReasons.length > 0;

    if (logoutReasonRequired) {
      const validationErrors = validateBreakReason(
        reasonRaw,
        incomingSettings.allowedBreakReasons,
      );
      if (validationErrors.length > 0) {
        return err(
          createPlatformError("validation_failed", "Logout reason required", {
            errors: validationErrors,
          }),
        );
      }
    }

    const statusReason =
      reasonRaw.length > 0 ? createStatusReason(reasonRaw) : null;

    this.eventPublisher.publish(
      createAgentLogoutRequestedEvent(correlationId, { reason: statusReason }),
    );

    this.logger.info("agent_logout_requested", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "logout_operator",
      previousState: snapshot.currentStatus ?? "none",
      nextState: "logout_requested",
      result: "requested",
    });

    try {
      const gatewayResult = await this.operatorGateway.requestLogout({
        reason: statusReason,
        correlationId,
      });

      if (gatewayResult.status === "failed") {
        this.logger.warn("agent_logout_gateway_failed", {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "logout_operator",
          result: gatewayResult.reason,
          gatewayMessage: gatewayResult.message,
        });
        return err(
          createPlatformError("operation_failed", gatewayResult.message, {
            reason: gatewayResult.reason,
          }),
        );
      }

      this.logger.info("agent_logout_gateway_succeeded", {
        correlationId,
        featureId: "F-010",
        boundedContext: "Operator",
        operation: "logout_operator",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "agent_logout_failed",
        {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "logout_operator",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
