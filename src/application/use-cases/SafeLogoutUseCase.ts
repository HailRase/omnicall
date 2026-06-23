import type { CallEngine } from "@application/services/CallEngine.js";
import type {
  AgentStatusReadModel,
  DomainEventPublisher,
  Logger,
  OperatorPlatformGateway,
  TelephonyGateway,
} from "@ports/index.js";
import { createAgentLogoutRequestedEvent } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const FEATURE_ID = "F-014";

export type SafeLogoutInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: user-initiated safe logout after server terminate (LF-048).
 * - Inputs: optional correlation id.
 * - Outputs: hangup calls, SIP unregister, OCP logout; AgentLogoutRequested event.
 */
export class SafeLogoutUseCase {
  constructor(
    private readonly callEngine: CallEngine,
    private readonly telephonyGateway: TelephonyGateway,
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
      await this.callEngine.hangupAllCalls(correlationId);

      const unregisterResult = await this.telephonyGateway.unregister(correlationId);
      this.logger.info("safe_logout_sip_unregister", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: "Telephony",
        operation: "safe_logout",
        result: unregisterResult.ok ? "succeeded" : unregisterResult.error.code,
      });

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
