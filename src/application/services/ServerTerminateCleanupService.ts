import type { CallEngine } from "@application/services/CallEngine.js";
import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  TelephonyGateway,
} from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { ConnectionRecoveryOrchestrationService } from "./ConnectionRecoveryOrchestrationService.js";

const FEATURE_ID = "F-014";

export type ServerTerminateCleanupDeps = Readonly<{
  callEngine: CallEngine;
  telephonyGateway: TelephonyGateway;
  operatorGateway: OperatorPlatformGateway;
  agentStatusReadModel: AgentStatusReadModel;
  connectionRecoveryOrchestration: ConnectionRecoveryOrchestrationService;
  logger: Logger;
}>;

/**
 * - Purpose: ordered teardown on OCP server terminate (LF-048).
 * - Inputs: ServerTerminateReceived via subscription.
 * - Outputs: hangup calls, SIP unregister, OCP logout when connected.
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

    await this.deps.callEngine.hangupAllCalls(correlationId);

    const unregisterResult = await this.deps.telephonyGateway.unregister(correlationId);
    this.deps.logger.info("server_terminate_sip_unregister", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "server_terminate_cleanup",
      result: unregisterResult.ok ? "succeeded" : unregisterResult.error.code,
    });

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
