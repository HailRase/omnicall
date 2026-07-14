/**
 * - Purpose: event-sourced DND flag for OCP Use Cases and bridges.
 * - Inputs: PhoneStatusChanged domain events.
 * - Outputs: isDndEnabled() for DndReadModel consumers.
 */

import type { DomainEvent } from "@domain/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import type { DndReadModel } from "@ports/settings/DndReadModel.js";

export class InMemoryDndReadModel implements DndReadModel {
  private enabled = false;
  private unsubscribe: (() => void) | null = null;

  constructor(eventPublisher: DomainEventPublisher, initialEnabled = false) {
    this.enabled = initialEnabled;
    this.unsubscribe = eventPublisher.subscribe((event) => {
      this.applyEvent(event);
    });
  }

  isDndEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private applyEvent(event: DomainEvent): void {
    if (event.type !== "PhoneStatusChanged") {
      return;
    }
    const nextStatus = event["nextStatus"];
    if (typeof nextStatus !== "string") {
      return;
    }
    this.enabled = nextStatus === "dnd";
  }
}
