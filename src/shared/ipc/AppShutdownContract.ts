import { isCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  isAppShutdownAction,
  isAppShutdownSource,
  type AppShutdownAction,
  type AppShutdownSource,
} from "@shared/platform/AppLifecycle.js";

export type { AppShutdownAction, AppShutdownSource } from "@shared/platform/AppLifecycle.js";

export type AppShutdownPayload = Readonly<{
  correlationId: CorrelationId;
  source: AppShutdownSource;
  action: AppShutdownAction;
}>;

export type AppShutdownAckPayload = Readonly<{
  correlationId: CorrelationId;
  action: AppShutdownAction;
  cleanupSkipped: boolean;
}>;

export type AppShutdownCancelReason =
  | "cleanup_failed"
  | "cleanup_ack_failed"
  | "cleanup_preload_unavailable";

export type AppShutdownCancelPayload = Readonly<{
  correlationId: CorrelationId;
  action: AppShutdownAction;
  reason: AppShutdownCancelReason;
}>;

const APP_SHUTDOWN_CANCEL_REASONS: ReadonlyArray<AppShutdownCancelReason> = [
  "cleanup_failed",
  "cleanup_ack_failed",
  "cleanup_preload_unavailable",
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
  const action = candidate["action"];

  if (typeof correlationId !== "string" || !isCorrelationId(correlationId)) {
    return null;
  }

  if (!isAppShutdownSource(source)) {
    return null;
  }

  if (!isAppShutdownAction(action)) {
    return null;
  }

  return {
    correlationId,
    source,
    action,
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

  const candidate = value as Record<string, unknown>;
  const correlationId = candidate["correlationId"];
  const action = candidate["action"];
  const cleanupSkipped = candidate["cleanupSkipped"];

  if (typeof correlationId !== "string" || !isCorrelationId(correlationId)) {
    return null;
  }

  if (!isAppShutdownAction(action)) {
    return null;
  }

  if (typeof cleanupSkipped !== "boolean") {
    return null;
  }

  return {
    correlationId,
    action,
    cleanupSkipped,
  };
}

/**
 * - Purpose: validate shutdown cancel payload for explicit coordinator reset.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed cancel payload or null when invalid.
 */
export function parseAppShutdownCancelPayload(value: unknown): AppShutdownCancelPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const correlationId = candidate["correlationId"];
  const action = candidate["action"];
  const reason = candidate["reason"];

  if (typeof correlationId !== "string" || !isCorrelationId(correlationId)) {
    return null;
  }

  if (!isAppShutdownAction(action)) {
    return null;
  }

  if (
    typeof reason !== "string" ||
    !APP_SHUTDOWN_CANCEL_REASONS.includes(reason as AppShutdownCancelReason)
  ) {
    return null;
  }

  return {
    correlationId,
    action,
    reason: reason as AppShutdownCancelReason,
  };
}
