import type { DomainEvent } from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { OcpSyncReadModel, OcpSyncReadModelSnapshot } from "@ports/operator/OcpSyncReadModel.js";
import {
  initialQueueInfoProjection,
  reduceQueueInfoProjection,
} from "../projections/operator/queueInfoProjection.js";

/**
 * - Purpose: event-sourced OCP sync availability for Use Case gating.
 * - Inputs: domain events via publisher subscription.
 * - Outputs: isOcpSyncAvailable snapshot aligned with queueInfoProjection.
 */
export class InMemoryOcpSyncReadModel implements OcpSyncReadModel {
  private isOcpSyncAvailable = initialQueueInfoProjection().isOcpSyncAvailable;

  constructor(eventPublisher: DomainEventPublisher) {
    eventPublisher.subscribe((event) => {
      this.applyEvent(event);
    });
  }

  getSnapshot(): OcpSyncReadModelSnapshot {
    return { isOcpSyncAvailable: this.isOcpSyncAvailable };
  }

  private applyEvent(event: DomainEvent): void {
    const next = reduceQueueInfoProjection(
      {
        isOcpSyncAvailable: this.isOcpSyncAvailable,
        queueNameByCallId: new Map(),
        queueLoadingSinceByCallId: new Map(),
      },
      event,
    );
    this.isOcpSyncAvailable = next.isOcpSyncAvailable;
  }
}
