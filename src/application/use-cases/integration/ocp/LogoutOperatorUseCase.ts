import { createOperatorLoggedOutEvent } from "@domain/integration/ocp/events/OperatorLoggedOut.js";
import type { OcpCommandCallType } from "@domain/integration/ocp/protocol/OcpCommand.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
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

export type LogoutOperatorInput = Readonly<{
  reasonId: number;
  cascadeSipLogout?: boolean;
  callType: OcpCommandCallType;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: log out OCP operator with reason and optionally signal SIP cascade.
 * - Inputs: reason id, optional SIP cascade flag, call source type.
 * - Outputs: logout command, gateway disconnect, optional OperatorLoggedOut event.
 */
export class LogoutOperatorUseCase {
  constructor(
    private readonly deps: Readonly<{
      ocpGateway: OcpGateway;
      operatorReadModel: OcpOperatorReadModel;
      eventPublisher: DomainEventPublisher;
      logger: Logger;
    }>,
  ) {}

  execute(input: LogoutOperatorInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const profile = this.deps.operatorReadModel.getCurrentOperatorProfile();

    if (profile === null) {
      return Promise.resolve(
        err(createPlatformError("not_found", "ocp_operator_profile_missing")),
      );
    }

    this.deps.logger.info("logout_operator_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "logout_operator",
      operatorId: profile.operatorId,
      cascadeSipLogout: input.cascadeSipLogout === true,
      callType: input.callType,
      result: "requested",
    });

    const sendResult = this.deps.ocpGateway.sendCommand({
      kind: "change_status_to_logout",
      operatorId: profile.operatorId,
      reasonId: input.reasonId,
      callType: input.callType,
    });

    if (!sendResult.ok) {
      this.deps.logger.error(
        "logout_operator_send_failed",
        {
          correlationId,
          featureId: OCP_USE_CASE_FEATURE_ID,
          boundedContext: OCP_BOUNDED_CONTEXT,
          operation: "logout_operator",
          result: sendResult.error.code,
        },
        sendResult.error,
      );
      return Promise.resolve(sendResult);
    }

    this.deps.ocpGateway.disconnect("logout");

    if (input.cascadeSipLogout === true) {
      this.deps.eventPublisher.publish(
        createOperatorLoggedOutEvent(correlationId, {
          operatorId: profile.operatorId,
          reasonId: input.reasonId,
          timestamp: Date.now(),
        }),
      );
    }

    this.deps.logger.info("logout_operator_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "logout_operator",
      cascadeSipLogout: input.cascadeSipLogout === true,
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
