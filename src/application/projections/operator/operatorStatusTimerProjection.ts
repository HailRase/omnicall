import type { AgentStatus } from "@domain/index.js";

/**
 * - Purpose: derive status duration timer fields for operator status UI (LF-046).
 * - Inputs: status changed timestamp and optional current instant.
 * - Outputs: duration seconds and timer running flag.
 */
export function deriveStatusDurationSeconds(
  statusChangedAt: string | null,
  nowIso: string,
): number | null {
  if (statusChangedAt === null) {
    return null;
  }

  const changedAtMs = Date.parse(statusChangedAt);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(changedAtMs) || Number.isNaN(nowMs)) {
    return null;
  }

  const diffMs = nowMs - changedAtMs;
  if (diffMs < 0) {
    return null;
  }

  return Math.floor(diffMs / 1000);
}

export function deriveStatusTimerRunning(
  currentStatus: AgentStatus | null,
  statusChangedAt: string | null,
): boolean {
  return currentStatus !== null && statusChangedAt !== null;
}
