import { createAppShutdownRequestedEvent } from "@domain/platform/appLifecycleEvents.js";
import type { AppShutdownSource } from "@domain/platform/appLifecycleEvents.js";
import type { CallEngine } from "@application/services/CallEngine.js";
import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  TelephonyGateway,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { ConnectionRecoveryOrchestrationService } from "../services/ConnectionRecoveryOrchestrationService.js";

const FEATURE_ID = "F-014";

export type ShutdownCleanupInput = Readonly<{
  source: AppShutdownSource;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: ordered app shutdown cleanup for SIP/OCP sessions (LF-079).
 * - Inputs: shutdown source and optional correlation id.
 * - Outputs: hangup, unregister, scheduler dispose, OCP logout; AppShutdownRequested event.
 */
export class ShutdownCleanupUseCase {
  private cleanupCompleted = false;

  constructor(
    private readonly callEngine: CallEngine,
    private readonly telephonyGateway: TelephonyGateway,
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly connectionRecoveryOrchestration: ConnectionRecoveryOrchestrationService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: ShutdownCleanupInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    if (this.cleanupCompleted) {
      this.logger.info("shutdown_cleanup_skipped", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "shutdown_cleanup",
        result: "already_completed",
      });
      return ok(undefined);
    }

    this.eventPublisher.publish(
      createAppShutdownRequestedEvent(correlationId, { source: input.source }),
    );

    this.logger.info("shutdown_cleanup_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Telephony",
      operation: "shutdown_cleanup",
      source: input.source,
      previousState: "running",
      nextState: "shutting_down",
    });

    try {
      await this.callEngine.hangupAllCalls(correlationId);

      const unregisterResult = await this.telephonyGateway.unregister(correlationId);
      this.logger.info("shutdown_sip_unregister", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "shutdown_cleanup",
        result: unregisterResult.ok ? "succeeded" : unregisterResult.error.code,
      });

      this.connectionRecoveryOrchestration.dispose();

      const snapshot = this.agentStatusReadModel.getSnapshot();
      if (snapshot.isOcpStatusAvailable) {
        const logoutResult = await this.operatorGateway.requestLogout({
          reason: null,
          correlationId,
        });
        this.logger.info("shutdown_ocp_logout", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Operator",
          operation: "shutdown_cleanup",
          result: logoutResult.status,
        });
      }

      this.cleanupCompleted = true;

      this.logger.info("shutdown_cleanup_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "shutdown_cleanup",
        source: input.source,
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "shutdown_cleanup_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "shutdown_cleanup",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
