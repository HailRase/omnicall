import { createDomainEvent } from "../shared/DomainEvent.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { AppShutdownSource } from "@shared/platform/AppLifecycle.js";

export type AppShutdownRequestedEvent = ReturnType<typeof createAppShutdownRequestedEvent>;

/**
 * - Purpose: signal application shutdown for ordered telephony/OCP cleanup (LF-079).
 * - Inputs: correlationId, shutdown source.
 * - Outputs: AppShutdownRequested domain event.
 */
export function createAppShutdownRequestedEvent(
  correlationId: CorrelationId,
  payload: Readonly<{
    source: AppShutdownSource;
  }>,
) {
  return createDomainEvent("AppShutdownRequested", correlationId, payload);
}
