import type { DomainEvent } from "@domain/index.js";
import type {
  DomainEventHandler,
  DomainEventPublisher,
} from "@ports/index.js";

export class InMemoryDomainEventBus implements DomainEventPublisher {
  private readonly handlers = new Set<DomainEventHandler>();

  publish(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  subscribe(handler: DomainEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  clear(): void {
    this.handlers.clear();
  }
}
