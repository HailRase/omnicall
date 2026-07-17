import type {
  OcpDisconnectReason,
  OcpGateway,
} from "@ports/integration/OcpGateway.js";
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
  reason?: Exclude<OcpDisconnectReason, "error">;
}>;

/**
 * - Purpose: close OCP session without sending logout status command.
 * - Inputs: optional correlation id and disconnect reason (`logout` | `terminate`).
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
    const reason = input.reason ?? "logout";
    const previousState = this.ocpGateway.getConnectionState();
    // Transport ends disconnected; Application maps terminate → dual-FSM terminal projection.
    const nextState = "disconnected";

    this.logger.info("disconnect_ocp_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "disconnect_ocp",
      previousState,
      nextState,
      reason,
      result: "requested",
    });

    this.ocpGateway.disconnect(reason);

    this.logger.info("disconnect_ocp_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "disconnect_ocp",
      reason,
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
