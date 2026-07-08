import {
  createAgentStatusChangedEvent,
  type AgentStatus,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";

/**
 * - Purpose: seed initial agent status after OCP authentication.
 * - Inputs: correlation ID and gateway status query.
 * - Outputs: `AgentStatusChanged` when gateway returns initial status.
 */
export class AgentStatusSyncService {
  constructor(
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async syncAfterOcpAuth(correlationId: CorrelationId): Promise<void> {
    try {
      const initialStatus = await this.operatorGateway.getAgentStatus({
        correlationId,
      });

      if (initialStatus === null) {
        return;
      }

      this.publishInitialStatus(correlationId, initialStatus);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "agent_status_sync_failed",
        {
          correlationId,
          featureId: "F-010",
          boundedContext: "Operator",
          operation: "sync_agent_status",
          result: "error",
        },
        error,
      );
      this.logger.warn("agent_status_sync_failed_message", {
        correlationId,
        message: normalized.message,
      });
    }
  }

  private publishInitialStatus(
    correlationId: CorrelationId,
    initialStatus: AgentStatus,
  ): void {
    const changedAt = new Date().toISOString();
    this.eventPublisher.publish(
      createAgentStatusChangedEvent(correlationId, {
        previousStatus: null,
        currentStatus: initialStatus,
        reason: null,
        changedAt,
      }),
    );

    this.logger.info("agent_status_synced", {
      correlationId,
      featureId: "F-010",
      boundedContext: "Operator",
      operation: "sync_agent_status",
      nextState: initialStatus,
      result: "succeeded",
    });
  }
}
