import { isCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { AppShutdownSource } from "@domain/platform/appLifecycleEvents.js";

export type AppShutdownPayload = Readonly<{
  correlationId: CorrelationId;
  source: AppShutdownSource;
}>;

export type AppShutdownAckPayload = Readonly<{
  correlationId: CorrelationId;
}>;

const APP_SHUTDOWN_SOURCES: ReadonlyArray<AppShutdownSource> = [
  "before-quit",
  "window-close",
];

/**
 * - Purpose: validate app shutdown IPC payloads at preload boundary (LF-079).
 * - Inputs: unknown IPC payload.
 * - Outputs: typed shutdown payload or null when invalid.
 */
export function parseAppShutdownPayload(value: unknown): AppShutdownPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const correlationId = candidate["correlationId"];
  const source = candidate["source"];

  if (typeof correlationId !== "string" || !isCorrelationId(correlationId)) {
    return null;
  }

  if (typeof source !== "string" || !APP_SHUTDOWN_SOURCES.includes(source as AppShutdownSource)) {
    return null;
  }

  return {
    correlationId,
    source: source as AppShutdownSource,
  };
}

/**
 * - Purpose: validate shutdown acknowledgement IPC payload.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed ack payload or null when invalid.
 */
export function parseAppShutdownAckPayload(value: unknown): AppShutdownAckPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const correlationId = (value as Record<string, unknown>)["correlationId"];
  if (typeof correlationId !== "string" || !isCorrelationId(correlationId)) {
    return null;
  }

  return { correlationId };
}
