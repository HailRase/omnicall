/**
 * - Purpose: cascade SIP session teardown when OCP operator logout/terminate events fire.
 * - Inputs: OperatorLoggedOut Domain Event + injected EndUserSession runner.
 * - Outputs: best-effort SIP teardown (idempotent via EndUserSessionUseCase).
 */

import type { DomainEvent } from "@domain/index.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

export type OcpSipCascadeBridgeServiceDeps = Readonly<{
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  endUserSession: (correlationId: CorrelationId) => Promise<void>;
}>;

export class OcpSipCascadeBridgeService {
  private readonly unsubscribe: () => void;
  private cascadeInFlight = false;

  constructor(private readonly deps: OcpSipCascadeBridgeServiceDeps) {
    this.unsubscribe = deps.eventPublisher.subscribe((event) => {
      void this.handleDomainEvent(event);
    });
  }

  dispose(): void {
    this.unsubscribe();
  }

  private async handleDomainEvent(event: DomainEvent): Promise<void> {
    if (event.type !== "OperatorLoggedOut") {
      return;
    }
    if (this.cascadeInFlight) {
      return;
    }

    this.cascadeInFlight = true;
    const correlationId = event.correlationId;

    this.deps.logger.info("ocp_sip_cascade_started", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_sip_cascade",
      result: "requested",
    });

    try {
      await this.deps.endUserSession(correlationId);
      this.deps.logger.info("ocp_sip_cascade_completed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_cascade",
        result: "completed",
      });
    } catch (error: unknown) {
      this.deps.logger.error(
        "ocp_sip_cascade_failed",
        {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_sip_cascade",
          result: "failed",
        },
        error,
      );
    } finally {
      this.cascadeInFlight = false;
    }
  }
}
