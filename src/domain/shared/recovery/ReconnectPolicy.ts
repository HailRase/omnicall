export type ReconnectPolicyConfig = Readonly<{
  maxAttempts: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  jitterFraction: number;
}>;

/** SIP flat retry defaults when user settings are unavailable (LF-008). */
export const SIP_RECONNECT_POLICY_CONFIG: ReconnectPolicyConfig = {
  maxAttempts: 5,
  baseDelayMs: 5000,
  backoffMultiplier: 1,
  maxDelayMs: 5000,
  jitterFraction: 0,
} as const;

export type RandomSource = () => number;

export function defaultRandomSource(): number {
  return Math.random();
}

/**
 * - Purpose: compute uncapped backoff delay before jitter (LF-008).
 * - Inputs: attempt number (1-based), policy config.
 * - Outputs: delay in milliseconds without jitter.
 */
export function computeBaseBackoffDelayMs(
  attemptNumber: number,
  config: ReconnectPolicyConfig,
): number {
  if (attemptNumber < 1) {
    return config.baseDelayMs;
  }
  const exponent = attemptNumber - 1;
  const scaled = config.baseDelayMs * config.backoffMultiplier ** exponent;
  return Math.min(Math.round(scaled), config.maxDelayMs);
}

/**
 * - Purpose: apply symmetric jitter around base backoff delay.
 * - Inputs: attempt number, config, random source (injectable for tests).
 * - Outputs: delay in milliseconds with jitter applied.
 */
export function computeReconnectDelayMs(
  attemptNumber: number,
  config: ReconnectPolicyConfig,
  random: RandomSource = defaultRandomSource,
): number {
  const baseDelayMs = computeBaseBackoffDelayMs(attemptNumber, config);
  const jitterRange = baseDelayMs * config.jitterFraction;
  const jitterOffset = (random() * 2 - 1) * jitterRange;
  return Math.max(0, Math.round(baseDelayMs + jitterOffset));
}

/**
 * - Purpose: derive deterministic jitter bounds for observability and tests.
 * - Inputs: attempt number, config.
 * - Outputs: min/max delay window in milliseconds.
 */
export function computeReconnectDelayBounds(
  attemptNumber: number,
  config: ReconnectPolicyConfig,
): Readonly<{ minDelayMs: number; maxDelayMs: number }> {
  const baseDelayMs = computeBaseBackoffDelayMs(attemptNumber, config);
  const jitterRange = baseDelayMs * config.jitterFraction;
  return {
    minDelayMs: Math.max(0, Math.round(baseDelayMs - jitterRange)),
    maxDelayMs: Math.round(baseDelayMs + jitterRange),
  };
}

/**
 * - Purpose: decide whether another reconnect attempt may be scheduled.
 * - Inputs: next attempt number (1-based), config.
 * - Outputs: true when attempt is within maxAttempts.
 */
export function canScheduleReconnectAttempt(
  nextAttemptNumber: number,
  config: ReconnectPolicyConfig,
): boolean {
  return nextAttemptNumber >= 1 && nextAttemptNumber <= config.maxAttempts;
}

/**
 * - Purpose: detect terminal failure after exhausting retry budget.
 * - Inputs: failed attempt number (1-based), config.
 * - Outputs: true when no further automatic retries are allowed.
 */
export function isTerminalReconnectFailure(
  failedAttemptNumber: number,
  config: ReconnectPolicyConfig,
): boolean {
  return failedAttemptNumber >= config.maxAttempts;
}

export type ReconnectSchedulePlan = Readonly<{
  attemptNumber: number;
  delayMs: number;
}>;

/**
 * - Purpose: plan next reconnect attempt with explicit delay.
 * - Inputs: next attempt number, config, random source.
 * - Outputs: schedule plan or null when max attempts exceeded.
 */
export function planReconnectAttempt(
  nextAttemptNumber: number,
  config: ReconnectPolicyConfig,
  random: RandomSource = defaultRandomSource,
): ReconnectSchedulePlan | null {
  if (!canScheduleReconnectAttempt(nextAttemptNumber, config)) {
    return null;
  }
  return {
    attemptNumber: nextAttemptNumber,
    delayMs: computeReconnectDelayMs(nextAttemptNumber, config, random),
  };
}
