/**
 * Format remaining seconds as `MM:SS` for operator modal headers (e.g. `02:00`, `00:30`).
 */

export function formatMmSsCountdown(secondsRemaining: number): string {
  const clamped = Math.max(0, Math.floor(secondsRemaining));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Whole seconds remaining until ISO deadline (never negative). */
export function deriveSecondsRemainingUntil(
  expiresAtIso: string,
  nowMs: number,
): number {
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) {
    return 0;
  }
  return Math.max(0, Math.ceil((expiresMs - nowMs) / 1000));
}
