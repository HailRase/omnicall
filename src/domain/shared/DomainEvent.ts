import type { CorrelationId } from "@shared/correlation-id/index.js";

export type DomainEventBase = Readonly<{
  type: string;
  correlationId: CorrelationId;
  occurredAt: string;
}>;

export type DomainEvent = DomainEventBase & Readonly<Record<string, unknown>>;

export function createDomainEvent<TType extends string, TPayload extends object>(
  type: TType,
  correlationId: CorrelationId,
  payload: TPayload,
): DomainEventBase & { type: TType } & TPayload {
  return {
    type,
    correlationId,
    occurredAt: new Date().toISOString(),
    ...payload,
  };
}
