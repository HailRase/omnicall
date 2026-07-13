import { createOcpConnectionConfig } from "@domain/integration/ocp/OcpConnectionConfig.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
} from "./ocpUseCaseShared.js";

export type ConnectOcpInput = Readonly<{
  domain: string;
  authToken: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: start OCP WebSocket session with validated connection config.
 * - Inputs: domain hostname and auth token from settings or host-page.
 * - Outputs: gateway connect side effect or normalized validation error.
 */
export class ConnectOcpUseCase {
  constructor(
    private readonly ocpGateway: OcpGateway,
    private readonly logger: Logger,
  ) {}

  execute(input: ConnectOcpInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const configResult = createOcpConnectionConfig({
      domain: input.domain,
      authToken: input.authToken,
    });

    if (!configResult.ok) {
      this.logger.warn("connect_ocp_validation_failed", {
        correlationId,
        featureId: OCP_USE_CASE_FEATURE_ID,
        boundedContext: OCP_BOUNDED_CONTEXT,
        operation: "connect_ocp",
        result: configResult.error,
      });
      return Promise.resolve(
        err(
          createPlatformError("validation_failed", configResult.error, {
            reason: configResult.error,
          }),
        ),
      );
    }

    this.logger.info("connect_ocp_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "connect_ocp",
      domain: configResult.value.domain,
      previousState: this.ocpGateway.getConnectionState(),
      nextState: "connecting",
      result: "requested",
    });

    this.ocpGateway.connect(configResult.value);

    this.logger.info("connect_ocp_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "connect_ocp",
      domain: configResult.value.domain,
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
