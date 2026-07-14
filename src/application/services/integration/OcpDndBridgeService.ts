/**
 * - Purpose: map PhoneStatus DND to OCP operator break/reserve commands.
 * - Inputs: PhoneStatusChanged domain events + operator busy/auth snapshot.
 * - Outputs: ChangeOperatorStatus / ReservePostCallStatus Use Case calls.
 */

import type { DomainEvent } from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { ChangeOperatorStatusUseCase } from "../../use-cases/integration/ocp/ChangeOperatorStatusUseCase.js";
import type { ReservePostCallStatusUseCase } from "../../use-cases/integration/ocp/ReservePostCallStatusUseCase.js";
import { isBusy } from "@domain/integration/ocp/OperatorStatusMachine.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
/** Legacy DND→break used status value 7 as reasonId when reasons list unavailable. */
const OCP_DEFAULT_BREAK_REASON_ID = 7;

export type OcpDndBridgeServiceDeps = Readonly<{
  eventPublisher: DomainEventPublisher;
  operatorReadModel: OcpOperatorReadModel;
  isOcpAuthenticated: () => boolean;
  changeOperatorStatus: ChangeOperatorStatusUseCase;
  reservePostCallStatus: ReservePostCallStatusUseCase;
  logger: Logger;
}>;

export class OcpDndBridgeService {
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly deps: OcpDndBridgeServiceDeps) {
    this.unsubscribe = deps.eventPublisher.subscribe((event) => {
      void this.handleDomainEvent(event);
    });
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private async handleDomainEvent(event: DomainEvent): Promise<void> {
    if (event.type !== "PhoneStatusChanged") {
      return;
    }
    if (!this.deps.isOcpAuthenticated()) {
      return;
    }
    if (event["nextStatus"] !== "dnd") {
      return;
    }

    const profile = this.deps.operatorReadModel.getCurrentOperatorProfile();
    if (profile === null) {
      this.deps.logger.warn("ocp_dnd_bridge_missing_profile", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "dnd_to_break",
        result: "profile_missing",
      });
      return;
    }

    if (isBusy(profile.status)) {
      const result = await this.deps.reservePostCallStatus.execute({
        operatorId: profile.operatorId,
        targetStatus: "break",
        reasonId: OCP_DEFAULT_BREAK_REASON_ID,
        correlationId: event.correlationId,
      });
      if (!result.ok) {
        this.deps.logger.warn("ocp_dnd_bridge_reserve_failed", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "dnd_to_break_busy",
          result: result.error.code,
        });
      }
      return;
    }

    const result = await this.deps.changeOperatorStatus.execute({
      targetStatus: "break",
      reasonId: OCP_DEFAULT_BREAK_REASON_ID,
      callType: "internal",
      correlationId: event.correlationId,
    });
    if (!result.ok) {
      this.deps.logger.warn("ocp_dnd_bridge_change_failed", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "dnd_to_break_idle",
        result: result.error.code,
      });
    }
  }
}
