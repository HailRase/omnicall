import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  mapOcpUserTargetStatus,
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
  type OcpUserTargetStatus,
} from "./ocpUseCaseShared.js";

export type ReservePostCallStatusInput = Readonly<{
  operatorId: number;
  targetStatus: OcpUserTargetStatus;
  reasonId: number;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: reserve next operator status while busy on a call.
 * - Inputs: operator id, target status, reason id.
 * - Outputs: update_post_call_status gateway command.
 */
export class ReservePostCallStatusUseCase {
  constructor(
    private readonly ocpGateway: OcpGateway,
    private readonly logger: Logger,
  ) {}

  execute(
    input: ReservePostCallStatusInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const reservedStatus = mapOcpUserTargetStatus(input.targetStatus);

    this.logger.info("reserve_post_call_status_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "reserve_post_call_status",
      operatorId: input.operatorId,
      reservedStatus,
      result: "requested",
    });

    const sendResult = this.ocpGateway.sendCommand({
      kind: "update_post_call_status",
      operatorId: input.operatorId,
      reasonId: input.reasonId,
      reservedStatus,
    });

    if (!sendResult.ok) {
      this.logger.error(
        "reserve_post_call_status_send_failed",
        {
          correlationId,
          featureId: OCP_USE_CASE_FEATURE_ID,
          boundedContext: OCP_BOUNDED_CONTEXT,
          operation: "reserve_post_call_status",
          result: sendResult.error.code,
        },
        sendResult.error,
      );
      return Promise.resolve(sendResult);
    }

    this.logger.info("reserve_post_call_status_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "reserve_post_call_status",
      reservedStatus,
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
