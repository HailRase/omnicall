import type { ReconnectPolicyConfig } from "../shared/recovery/ReconnectPolicy.js";
import type { UserSettings } from "./UserSettings.js";

export const MIN_SIP_REREGISTER_INTERVAL_SEC = 5;
export const MIN_SIP_RECONNECT_INTERVAL_SEC = 5;
export const DEFAULT_SIP_REREGISTER_INTERVAL_SEC = 5;
export const DEFAULT_SIP_RECONNECT_INTERVAL_SEC = 5;
export const DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS = 5;
export const DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS = 5;

function buildFlatRecoveryPolicy(
  intervalSec: number,
  maxAttempts: number,
  minIntervalSec: number,
): ReconnectPolicyConfig {
  const clampedIntervalSec = Math.max(minIntervalSec, intervalSec);
  const delayMs = clampedIntervalSec * 1000;

  return {
    maxAttempts,
    baseDelayMs: delayMs,
    backoffMultiplier: 1,
    maxDelayMs: delayMs,
    jitterFraction: 0,
  };
}

/**
 * - Purpose: build flat SIP transport reconnect policy from user settings (ADR-0004).
 * - Inputs: UserSettings v2 with transport recovery fields.
 * - Outputs: ReconnectPolicyConfig without backoff or jitter.
 */
export function buildSipTransportRecoveryPolicy(settings: UserSettings): ReconnectPolicyConfig {
  return buildFlatRecoveryPolicy(
    settings.sipReconnectIntervalSec,
    settings.sipReconnectMaxAttempts,
    MIN_SIP_RECONNECT_INTERVAL_SEC,
  );
}

/**
 * - Purpose: build flat SIP REGISTER retry policy from user settings (LF-008).
 * - Inputs: UserSettings v2 with registration recovery fields.
 * - Outputs: ReconnectPolicyConfig without backoff or jitter.
 */
export function buildSipRegistrationRecoveryPolicy(settings: UserSettings): ReconnectPolicyConfig {
  return buildFlatRecoveryPolicy(
    settings.sipReregisterIntervalSec,
    settings.sipReregisterMaxAttempts,
    MIN_SIP_REREGISTER_INTERVAL_SEC,
  );
}

/**
 * - Purpose: build flat SIP recovery policy from persisted user settings (LF-008).
 * - Inputs: UserSettings with SIP recovery fields.
 * - Outputs: registration ReconnectPolicyConfig (backward-compatible alias).
 */
export function buildSipRecoveryPolicyFromUserSettings(
  settings: UserSettings,
): ReconnectPolicyConfig {
  return buildSipRegistrationRecoveryPolicy(settings);
}
