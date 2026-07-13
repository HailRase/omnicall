import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import {
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
} from "./ocpUseCaseShared.js";

export type DisconnectOcpInput = Readonly<{
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: close OCP session without sending logout status command.
 * - Inputs: optional correlation id.
 * - Outputs: gateway disconnect side effect.
 */
export class DisconnectOcpUseCase {
  constructor(
    private readonly ocpGateway: OcpGateway,
    private readonly logger: Logger,
  ) {}

  execute(
    input: DisconnectOcpInput = {},
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const previousState = this.ocpGateway.getConnectionState();

    this.logger.info("disconnect_ocp_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "disconnect_ocp",
      previousState,
      nextState: "disconnected",
      result: "requested",
    });

    this.ocpGateway.disconnect("logout");

    this.logger.info("disconnect_ocp_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "disconnect_ocp",
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
