import type { DomainEvent } from "@domain/index.js";
import type {
  ConnectionRecoveryReadModel,
  ConnectionRecoveryReadModelSnapshot,
} from "@ports/operator/ConnectionRecoveryReadModel.js";
import type { DomainEventPublisher } from "@ports/index.js";
import {
  initialOcpConnectionRecoveryProjection,
  reduceOcpConnectionRecoveryProjection,
  type OcpConnectionRecoveryProjection,
} from "../projections/ocpConnectionRecoveryProjection.js";

/**
 * - Purpose: event-sourced OCP connection recovery snapshot for Use Cases (F-014).
 * - Inputs: domain events from publisher subscription.
 * - Outputs: current OCP connection recovery read model snapshot.
 */
export class InMemoryConnectionRecoveryReadModel implements ConnectionRecoveryReadModel {
  private projection: OcpConnectionRecoveryProjection = initialOcpConnectionRecoveryProjection();

  constructor(eventPublisher: DomainEventPublisher) {
    eventPublisher.subscribe((event) => {
      this.applyEvent(event);
    });
  }

  getSnapshot(): ConnectionRecoveryReadModelSnapshot {
    return {
      connectionState: this.projection.connectionState,
      isOcpMode: this.projection.isOcpMode,
      ocpReconnectAttempt: this.projection.ocpReconnectAttempt,
    };
  }

  private applyEvent(event: DomainEvent): void {
    this.projection = reduceOcpConnectionRecoveryProjection(this.projection, event);
  }
}
