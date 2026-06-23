import {
  createAccessDeniedDetectedEvent,
  createOcpAuthenticationFailedEvent,
  createOcpAuthenticationRequestedEvent,
  createOcpAuthenticationSucceededEvent,
  createSipCredentialsReceivedEvent,
} from "@domain/index.js";
import type { OperatorPlatformGateway } from "@ports/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, isErr, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type AuthenticateOcpInput = Readonly<{
  token: string;
  domain: string;
  correlationId?: CorrelationId;
}>;

export class AuthenticateOcpUseCase {
  constructor(
    private readonly operatorGateway: OperatorPlatformGateway,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: AuthenticateOcpInput,
  ): Promise<Result<void, ReturnType<typeof createPlatformError>>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.eventPublisher.publish(
      createOcpAuthenticationRequestedEvent(correlationId, {
        token: input.token,
        domain: input.domain,
      }),
    );

    this.logger.info("ocp_authentication_requested", {
      correlationId,
      featureId: "F-009",
      boundedContext: "Operator",
      operation: "authenticate_ocp",
    });

    try {
      const result = await this.operatorGateway.authenticate({
        token: input.token,
        domain: input.domain,
        correlationId,
      });

      if (result.status === "failed") {
        this.eventPublisher.publish(
          createOcpAuthenticationFailedEvent(correlationId, {
            reason: result.reason,
            message: result.message,
          }),
        );

        if (result.reason === "access_denied") {
          this.eventPublisher.publish(
            createAccessDeniedDetectedEvent(correlationId, {
              source: "ocp",
              reason: result.message,
            }),
          );
        }

        this.logger.warn("ocp_authentication_failed", {
          correlationId,
          featureId: "F-009",
          boundedContext: "Operator",
          operation: "authenticate_ocp",
          result: result.reason,
        });

        return err(
          createPlatformError("operation_failed", result.message, result),
        );
      }

      this.eventPublisher.publish(
        createOcpAuthenticationSucceededEvent(correlationId, {
          sessionId: result.session.id,
          agentId: result.session.agentId,
        }),
      );

      this.eventPublisher.publish(
        createSipCredentialsReceivedEvent(correlationId, {
          credentials: result.sipCredentials,
          source: "ocp",
        }),
      );

      this.logger.info("ocp_authentication_succeeded", {
        correlationId,
        featureId: "F-009",
        boundedContext: "Operator",
        operation: "authenticate_ocp",
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.eventPublisher.publish(
        createOcpAuthenticationFailedEvent(correlationId, {
          reason: "unknown",
          message: normalized.message,
        }),
      );

      this.logger.error(
        "ocp_authentication_failed",
        {
          correlationId,
          featureId: "F-009",
          boundedContext: "Operator",
          operation: "authenticate_ocp",
          result: "error",
        },
        error,
      );

      return err(normalized);
    }
  }
}

export function isAuthenticateOcpSuccess(
  result: Result<void, ReturnType<typeof createPlatformError>>,
): boolean {
  return !isErr(result);
}
