import type { DomainEvent } from "@domain/index.js";

export type DomainEventHandler = (event: DomainEvent) => void;

export interface DomainEventPublisher {
  publish(event: DomainEvent): void;
  subscribe(handler: DomainEventHandler): () => void;
}
