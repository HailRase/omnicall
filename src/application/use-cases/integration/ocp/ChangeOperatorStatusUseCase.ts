import {
  OperatorStatus,
  type OperatorStatus as OperatorStatusType,
} from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpCommandCallType } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import {
  isBusy,
  validateTransition,
} from "@domain/integration/ocp/OperatorStatusMachine.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { DndReadModel } from "@ports/settings/DndReadModel.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  mapOcpUserTargetStatus,
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
  type OcpUserTargetStatus,
} from "./ocpUseCaseShared.js";

export type ChangeOperatorStatusInput = Readonly<{
  targetStatus: OcpUserTargetStatus;
  reasonId: number;
  callType: OcpCommandCallType;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: change OCP operator status to ready or break via gateway commands.
 * - Inputs: target status, reason id, call source type, optional correlation id.
 * - Outputs: gateway command side effect or normalized guard/validation failure.
 */
export class ChangeOperatorStatusUseCase {
  constructor(
    private readonly deps: Readonly<{
      ocpGateway: OcpGateway;
      operatorReadModel: OcpOperatorReadModel;
      dndReadModel: DndReadModel;
      logger: Logger;
    }>,
  ) {}

  execute(
    input: ChangeOperatorStatusInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const profile = this.deps.operatorReadModel.getCurrentOperatorProfile();

    if (profile === null) {
      return Promise.resolve(
        err(createPlatformError("not_found", "ocp_operator_profile_missing")),
      );
    }

    const currentStatus = profile.status;
    const targetOperatorStatus = mapOcpUserTargetStatus(input.targetStatus);

    this.deps.logger.info("change_operator_status_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "change_operator_status",
      previousState: String(currentStatus),
      nextState: String(targetOperatorStatus),
      callType: input.callType,
      result: "requested",
    });

    if (
      input.targetStatus === "ready" &&
      this.deps.dndReadModel.isDndEnabled()
    ) {
      this.deps.logger.warn("change_operator_status_blocked_by_dnd", {
        correlationId,
        featureId: OCP_USE_CASE_FEATURE_ID,
        boundedContext: OCP_BOUNDED_CONTEXT,
        operation: "change_operator_status",
        result: "dnd_blocks_ready",
      });
      return Promise.resolve(
        err(
          createPlatformError("validation_failed", "dnd_blocks_ready", {
            reason: "dnd_blocks_ready",
          }),
        ),
      );
    }

    const command = this.buildCommand({
      operatorId: profile.operatorId,
      currentStatus,
      targetOperatorStatus,
      reasonId: input.reasonId,
      callType: input.callType,
    });

    if (!command.ok) {
      this.deps.logger.warn("change_operator_status_rejected", {
        correlationId,
        featureId: OCP_USE_CASE_FEATURE_ID,
        boundedContext: OCP_BOUNDED_CONTEXT,
        operation: "change_operator_status",
        result: command.error.message,
      });
      return Promise.resolve(command);
    }

    const sendResult = this.deps.ocpGateway.sendCommand(command.value);
    if (!sendResult.ok) {
      this.deps.logger.error(
        "change_operator_status_send_failed",
        {
          correlationId,
          featureId: OCP_USE_CASE_FEATURE_ID,
          boundedContext: OCP_BOUNDED_CONTEXT,
          operation: "change_operator_status",
          result: sendResult.error.code,
        },
        sendResult.error,
      );
      return Promise.resolve(sendResult);
    }

    this.deps.logger.info("change_operator_status_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "change_operator_status",
      commandKind: command.value.kind,
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }

  private buildCommand(input: Readonly<{
    operatorId: number;
    currentStatus: OperatorStatusType;
    targetOperatorStatus: typeof OperatorStatus.READY | typeof OperatorStatus.BREAK;
    reasonId: number;
    callType: OcpCommandCallType;
  }>): Result<OcpCommand, PlatformError> {
    if (isBusy(input.currentStatus)) {
      return ok({
        kind: "update_post_call_status",
        operatorId: input.operatorId,
        reasonId: input.reasonId,
        reservedStatus: input.targetOperatorStatus,
      });
    }

    const transition = validateTransition(
      input.currentStatus,
      input.targetOperatorStatus,
    );
    if (!transition.ok) {
      return err(
        createPlatformError("validation_failed", transition.error, {
          reason: transition.error,
        }),
      );
    }

    if (input.targetOperatorStatus === OperatorStatus.READY) {
      return ok({
        kind: "change_status_to_ready",
        operatorId: input.operatorId,
        reasonId: input.reasonId,
        callType: input.callType,
      });
    }

    return ok({
      kind: "change_status_to_break",
      operatorId: input.operatorId,
      reasonId: input.reasonId,
      callType: input.callType,
    });
  }
}
