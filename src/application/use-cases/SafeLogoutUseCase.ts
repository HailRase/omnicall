import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
} from "@ports/index.js";
import { createAgentLogoutRequestedEvent } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { SessionTeardownOrchestrationService } from "../services/SessionTeardownOrchestrationService.js";

const FEATURE_ID = "F-014";

export type SafeLogoutInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated safe logout after server terminate (LF-048).
 * - Inputs: optional correlation id.
 * - Outputs: SIP teardown via orchestrator; OCP logout when connected.
 */
export class SafeLogoutUseCase {
  constructor(
    private readonly sessionTeardown: SessionTeardownOrchestrationService,
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly agentStatusReadModel: AgentStatusReadModel,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(input: SafeLogoutInput = {}): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(
      createAgentLogoutRequestedEvent(correlationId, { reason: null }),
    );

    this.logger.info("safe_logout_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: "Operator",
      operation: "safe_logout",
      previousState: "server_terminate",
      nextState: "logout_in_progress",
    });

    try {
      const teardownResult = await this.sessionTeardown.execute({
        correlationId,
        operation: "safe_logout",
      });

      if (!teardownResult.ok) {
        this.logger.warn("safe_logout_sip_partial_failure", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Telephony",
          operation: "safe_logout",
          result: teardownResult.error.code,
        });
      }

      const snapshot = this.agentStatusReadModel.getSnapshot();
      if (snapshot.isOcpStatusAvailable) {
        const logoutResult = await this.operatorGateway.requestLogout({
          reason: null,
          correlationId,
        });

        if (logoutResult.status === "failed") {
          this.logger.warn("safe_logout_gateway_failed", {
            correlationId,
            featureId: FEATURE_ID,
            boundedContext: "Operator",
            operation: "safe_logout",
            result: logoutResult.reason,
          });
          return err(
            createPlatformError("operation_failed", logoutResult.message, {
              reason: logoutResult.reason,
            }),
          );
        }
      }

      this.logger.info("safe_logout_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Operator",
        operation: "safe_logout",
        result: "completed",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "safe_logout_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: "Operator",
          operation: "safe_logout",
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
