import type { ReconnectPolicyConfig } from "../shared/recovery/ReconnectPolicy.js";
import type { UserSettings } from "./UserSettings.js";

export const MIN_SIP_REREGISTER_INTERVAL_SEC = 5;
export const DEFAULT_SIP_REREGISTER_INTERVAL_SEC = 5;
export const DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS = 5;

/**
 * - Purpose: build flat SIP recovery policy from persisted user settings (LF-008).
 * - Inputs: UserSettings with SIP recovery fields.
 * - Outputs: ReconnectPolicyConfig without backoff or jitter.
 */
export function buildSipRecoveryPolicyFromUserSettings(
  settings: UserSettings,
): ReconnectPolicyConfig {
  const intervalSec = Math.max(
    MIN_SIP_REREGISTER_INTERVAL_SEC,
    settings.sipReregisterIntervalSec,
  );
  const delayMs = intervalSec * 1000;

  return {
    maxAttempts: settings.sipReregisterMaxAttempts,
    baseDelayMs: delayMs,
    backoffMultiplier: 1,
    maxDelayMs: delayMs,
    jitterFraction: 0,
  };
}
