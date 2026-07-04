import type { DomainEvent } from "@domain/index.js";
import type { SipSessionHealthReadModel } from "@ports/telephony/SipSessionHealthReadModel.js";
import type { DomainEventPublisher } from "@ports/index.js";
import {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
  type SipSessionHealthProjection,
} from "../projections/sipSessionHealthProjection.js";

/**
 * - Purpose: event-sourced SIP session health snapshot for Use Cases (F-014).
 * - Inputs: domain events from publisher subscription.
 * - Outputs: current SipSessionHealth read model snapshot.
 */
export class InMemorySipSessionHealthReadModel implements SipSessionHealthReadModel {
  private projection: SipSessionHealthProjection = initialSipSessionHealthProjection();

  constructor(eventPublisher: DomainEventPublisher) {
    eventPublisher.subscribe((event) => {
      this.applyEvent(event);
    });
  }

  getSnapshot(): SipSessionHealthProjection {
    return this.projection;
  }

  private applyEvent(event: DomainEvent): void {
    this.projection = reduceSipSessionHealthProjection(this.projection, event);
  }
}
