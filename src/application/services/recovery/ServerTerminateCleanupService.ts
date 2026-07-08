import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { SessionTeardownOrchestrationService } from "../platform/SessionTeardownOrchestrationService.js";

const FEATURE_ID = "F-014";

export type ServerTerminateCleanupDeps = Readonly<{
  sessionTeardown: SessionTeardownOrchestrationService;
  operatorGateway: OperatorPlatformGateway;
  agentStatusReadModel: AgentStatusReadModel;
  logger: Logger;
}>;

/**
 * - Purpose: ordered teardown on OCP server terminate (LF-048).
 * - Inputs: ServerTerminateReceived via subscription.
 * - Outputs: SIP teardown via orchestrator; OCP logout when connected.
 */
export class ServerTerminateCleanupService {
  private cleanupInProgress = false;

  constructor(private readonly deps: ServerTerminateCleanupDeps) {}

  subscribe(eventPublisher: DomainEventPublisher): void {
    eventPublisher.subscribe((event) => {
      if (event.type === "ServerTerminateReceived") {
        void this.executeCleanup(event.correlationId);
      }
    });
  }

  async executeCleanup(correlationId: CorrelationId): Promise<void> {
    if (this.cleanupInProgress) {
      this.deps.logger.info("server_terminate_cleanup_skipped", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Operator",
        operation: "server_terminate_cleanup",
        result: "already_in_progress",
      });
      return;
    }

    this.cleanupInProgress = true;

    this.deps.logger.info("server_terminate_cleanup_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation: "server_terminate_cleanup",
      previousState: "server_terminate",
      nextState: "cleanup_in_progress",
    });

    const teardownResult = await this.deps.sessionTeardown.execute({
      correlationId,
      operation: "server_terminate_cleanup",
    });

    if (!teardownResult.ok) {
      this.deps.logger.warn("server_terminate_sip_partial_failure", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "server_terminate_cleanup",
        result: teardownResult.error.code,
      });
    }

    const snapshot = this.deps.agentStatusReadModel.getSnapshot();
    if (snapshot.isOcpStatusAvailable) {
      const logoutResult = await this.deps.operatorGateway.requestLogout({
        reason: null,
        correlationId,
      });
      this.deps.logger.info("server_terminate_ocp_logout", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Operator",
        operation: "server_terminate_cleanup",
        result: logoutResult.status,
      });
    }

    this.cleanupInProgress = false;

    this.deps.logger.info("server_terminate_cleanup_completed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation: "server_terminate_cleanup",
      nextState: "cleanup_completed",
      result: "completed",
    });
  }
}
