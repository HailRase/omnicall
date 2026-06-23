import type { DomainEvent } from "@domain/index.js";
import type {
  ConnectionRecoveryReadModel,
  ConnectionRecoveryReadModelSnapshot,
} from "@ports/operator/ConnectionRecoveryReadModel.js";
import type { DomainEventPublisher } from "@ports/index.js";
import {
  initialConnectionRecoveryProjection,
  reduceConnectionRecoveryProjection,
  type ConnectionRecoveryProjection,
} from "../projections/connectionRecoveryProjection.js";

/**
 * - Purpose: event-sourced connection recovery snapshot for Use Cases (F-014).
 * - Inputs: domain events from publisher subscription.
 * - Outputs: current connection recovery read model snapshot.
 */
export class InMemoryConnectionRecoveryReadModel implements ConnectionRecoveryReadModel {
  private projection: ConnectionRecoveryProjection = initialConnectionRecoveryProjection();

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
      sipReconnectAttempt: this.projection.sipReconnectAttempt,
    };
  }

  private applyEvent(event: DomainEvent): void {
    this.projection = reduceConnectionRecoveryProjection(this.projection, event);
  }
}
