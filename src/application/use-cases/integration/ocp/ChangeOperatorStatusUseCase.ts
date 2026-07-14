import {
  OperatorStatus,
  type OperatorStatus as OperatorStatusType,
} from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpCommandCallType } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpCommand } from "@domain/integration/ocp/protocol/OcpCommand.js";
import { createOperatorStatusReservationSetEvent } from "@domain/integration/ocp/events/OperatorStatusReservationSet.js";
import {
  isBusy,
  validateTransition,
} from "@domain/integration/ocp/OperatorStatusMachine.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { DndReadModel } from "@ports/settings/DndReadModel.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
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

/**
 * - `auto` — busy → reserve; idle → FSM apply (host/DND default).
 * - `apply` — always FSM + change_status_to_* (finish post-call).
 * - `reserve` — always update_post_call_status.
 */
export type ChangeOperatorStatusIntent = "auto" | "apply" | "reserve";

export type ChangeOperatorStatusOutcome = Readonly<{
  kind: "applied" | "reserved";
  targetStatus: OcpUserTargetStatus;
  reasonId: number;
}>;

export type ChangeOperatorStatusInput = Readonly<{
  targetStatus: OcpUserTargetStatus;
  reasonId: number;
  callType: OcpCommandCallType;
  intent?: ChangeOperatorStatusIntent;
  correlationId?: CorrelationId;
}>;

export type OcpReservedStatusWriter = Readonly<{
  setReservedStatus: (
    reservedStatus: OperatorStatusType,
    reservedReasonId: number,
  ) => void;
}>;

/**
 * - Purpose: change OCP operator status to ready or break via gateway commands.
 * - Inputs: target status, reason id, call source type, optional intent/correlation.
 * - Outputs: applied|reserved outcome or normalized guard/validation failure.
 */
export class ChangeOperatorStatusUseCase {
  constructor(
    private readonly deps: Readonly<{
      ocpGateway: OcpGateway;
      operatorReadModel: OcpOperatorReadModel;
      dndReadModel: DndReadModel;
      logger: Logger;
      eventPublisher: DomainEventPublisher;
      reservedStatusWriter: OcpReservedStatusWriter;
    }>,
  ) {}

  execute(
    input: ChangeOperatorStatusInput,
  ): Promise<Result<ChangeOperatorStatusOutcome, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const intent = input.intent ?? "auto";
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
      intent,
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
      intent,
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

    const outcome = this.finalizeOutcome({
      command: command.value,
      operatorId: profile.operatorId,
      targetStatus: input.targetStatus,
      reasonId: input.reasonId,
      correlationId,
    });

    this.deps.logger.info("change_operator_status_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "change_operator_status",
      commandKind: command.value.kind,
      outcomeKind: outcome.kind,
      result: "completed",
    });

    return Promise.resolve(ok(outcome));
  }

  private buildCommand(input: Readonly<{
    operatorId: number;
    currentStatus: OperatorStatusType;
    targetOperatorStatus: typeof OperatorStatus.READY | typeof OperatorStatus.BREAK;
    reasonId: number;
    callType: OcpCommandCallType;
    intent: ChangeOperatorStatusIntent;
  }>): Result<OcpCommand, PlatformError> {
    const shouldReserve =
      input.intent === "reserve" ||
      (input.intent === "auto" && isBusy(input.currentStatus));

    if (shouldReserve) {
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

  private finalizeOutcome(input: Readonly<{
    command: OcpCommand;
    operatorId: number;
    targetStatus: OcpUserTargetStatus;
    reasonId: number;
    correlationId: CorrelationId;
  }>): ChangeOperatorStatusOutcome {
    if (input.command.kind === "update_post_call_status") {
      const reservedStatus = input.command.reservedStatus;
      this.deps.reservedStatusWriter.setReservedStatus(
        reservedStatus,
        input.reasonId,
      );
      this.deps.eventPublisher.publish(
        createOperatorStatusReservationSetEvent(input.correlationId, {
          operatorId: input.operatorId,
          reservedStatus,
          reservedReasonId: input.reasonId,
        }),
      );
      return {
        kind: "reserved",
        targetStatus: input.targetStatus,
        reasonId: input.reasonId,
      };
    }

    return {
      kind: "applied",
      targetStatus: input.targetStatus,
      reasonId: input.reasonId,
    };
  }
}
