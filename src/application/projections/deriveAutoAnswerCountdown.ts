/**
 * - Purpose: derive live auto-answer countdown from scheduled expiry timestamp.
 * - Inputs: ISO expiry time and current clock milliseconds.
 * - Outputs: seconds remaining down to zero, or null when inactive.
 */
export function computeAutoAnswerExpiresAt(
  timeoutSec: number,
  nowMs: number = Date.now(),
): string {
  return new Date(nowMs + timeoutSec * 1000).toISOString();
}

export function deriveAutoAnswerSecondsRemaining(
  expiresAtIso: string | null,
  nowMs: number,
): number | null {
  if (expiresAtIso === null) {
    return null;
  }

  const expiresAtMs = Date.parse(expiresAtIso);
  if (Number.isNaN(expiresAtMs)) {
    return null;
  }

  return Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
}
