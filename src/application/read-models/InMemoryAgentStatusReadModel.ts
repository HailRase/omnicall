import type { DomainEvent } from "@domain/index.js";
import type { AgentStatusReadModel, AgentStatusReadModelSnapshot } from "@ports/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import {
  initialOperatorStatusProjection,
  reduceOperatorStatusProjection,
  type OperatorStatusProjection,
} from "../projections/operator/operatorStatusProjection.js";

/**
 * - Purpose: event-sourced agent status snapshot for Use Cases.
 * - Inputs: domain events from publisher subscription.
 * - Outputs: current operator status read model snapshot.
 */
export class InMemoryAgentStatusReadModel implements AgentStatusReadModel {
  private projection: OperatorStatusProjection = initialOperatorStatusProjection();

  constructor(eventPublisher: DomainEventPublisher) {
    eventPublisher.subscribe((event) => {
      this.applyEvent(event);
    });
  }

  getSnapshot(): AgentStatusReadModelSnapshot {
    return {
      isOcpStatusAvailable: this.projection.isOcpStatusAvailable,
      currentStatus: this.projection.currentStatus,
      statusChangeInProgress: this.projection.statusChangeInProgress,
    };
  }

  private applyEvent(event: DomainEvent): void {
    this.projection = reduceOperatorStatusProjection(this.projection, event);
  }
}
