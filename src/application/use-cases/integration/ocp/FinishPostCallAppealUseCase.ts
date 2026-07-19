/**
 * - Purpose: finish OCP post-call processing by applying reserved status or Ready.
 * - Inputs: optional correlation id; reads profile + reservation from OcpOperatorReadModel.
 * - Outputs: change_status_to_ready|break via ChangeOperatorStatusUseCase (intent apply).
 */

import {
  isPostCallProcessing,
  resolvePostCallFinishTarget,
} from "@domain/integration/ocp/OperatorStatusMachine.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type {
  ChangeOperatorStatusOutcome,
  ChangeOperatorStatusUseCase,
} from "./ChangeOperatorStatusUseCase.js";
import {
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
} from "./ocpUseCaseShared.js";

export type FinishPostCallAppealInput = Readonly<{
  correlationId?: CorrelationId;
  callType?: "internal" | "external" | "sdk";
}>;

/**
 * Completes the appeal while in POST_CALL_PROCESSING.
 * Uses local reserved snapshot (last update_post_call_status) or defaults to Ready.
 */
export class FinishPostCallAppealUseCase {
  constructor(
    private readonly deps: Readonly<{
      operatorReadModel: OcpOperatorReadModel;
      changeOperatorStatus: ChangeOperatorStatusUseCase;
      logger: Logger;
    }>,
  ) {}

  execute(
    input: FinishPostCallAppealInput = {},
  ): Promise<Result<ChangeOperatorStatusOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const callType = input.callType ?? "internal";
    const profile = this.deps.operatorReadModel.getCurrentOperatorProfile();

    if (profile === null) {
      return Promise.resolve(
        err(createPlatformError("not_found", "ocp_operator_profile_missing")),
      );
    }

    if (!isPostCallProcessing(profile.status)) {
      this.deps.logger.warn("finish_post_call_appeal_rejected", {
        correlationId,
        featureId: OCP_USE_CASE_FEATURE_ID,
        boundedContext: OCP_BOUNDED_CONTEXT,
        operation: "finish_post_call_appeal",
        previousState: String(profile.status),
        result: "not_in_post_call_processing",
      });
      return Promise.resolve(
        err(
          createPlatformError(
            "validation_failed",
            "not_in_post_call_processing",
            { reason: "not_in_post_call_processing" },
          ),
        ),
      );
    }

    const finishTarget = resolvePostCallFinishTarget(
      this.deps.operatorReadModel.getReservedStatus(),
      this.deps.operatorReadModel.getReservedReasonId(),
    );

    this.deps.logger.info("finish_post_call_appeal_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "finish_post_call_appeal",
      previousState: String(profile.status),
      nextState: finishTarget.targetStatus,
      usedReservation: finishTarget.usedReservation,
      reasonId: finishTarget.reasonId,
      result: "requested",
    });

    return this.deps.changeOperatorStatus.execute({
      targetStatus: finishTarget.targetStatus,
      reasonId: finishTarget.reasonId,
      callType,
      intent: "apply",
      correlationId,
    });
  }
}
