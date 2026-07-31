/**
 * Bounded exponential backoff with jitter (SECURITY.md).
 */

import type { JitterSource } from './scheduler.js';

/** Bounded reconnect policy. @public */
export type ReconnectPolicy = {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  /** Fraction of delay applied as symmetric jitter, in [0, 1]. */
  readonly jitterRatio: number;
};

export const DEFAULT_RECONNECT_POLICY: ReconnectPolicy = {
  maxAttempts: 5,
  initialDelayMs: 200,
  maxDelayMs: 10_000,
  jitterRatio: 0.2
};

export function computeReconnectDelayMs(
  policy: ReconnectPolicy,
  attemptIndex: number,
  jitter: JitterSource
): number {
  if (attemptIndex < 0) {
    throw new Error('attemptIndex must be >= 0');
  }
  const exp = policy.initialDelayMs * 2 ** attemptIndex;
  const base = Math.min(policy.maxDelayMs, exp);
  const spread = base * policy.jitterRatio;
  const offset = (jitter.nextUnitInterval() * 2 - 1) * spread;
  return Math.max(0, Math.round(base + offset));
}

export function hasReconnectAttemptsRemaining(
  policy: ReconnectPolicy,
  attemptCount: number
): boolean {
  return attemptCount < policy.maxAttempts;
}
