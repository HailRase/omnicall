import { DEFAULT_APP_THEME, type AppTheme } from "./AppTheme.js";
import {
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "./SipRecoverySettings.js";

export const SETTINGS_SCHEMA_VERSION = 1 as const;

export type SettingsSchemaVersion = typeof SETTINGS_SCHEMA_VERSION;

/** Max auto-answer delay (seconds) aligned with legacy operator UX. */
export const MAX_AUTO_ANSWER_TIMEOUT_SEC = 300;

export type UserSettings = Readonly<{
  schemaVersion: SettingsSchemaVersion;
  theme: AppTheme;
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  autoAnswerTimeoutSec: number | null;
  ringbackToneEnabled: boolean;
  sipAutoReregisterEnabled: boolean;
  sipReregisterIntervalSec: number;
  sipReregisterMaxAttempts: number;
}>;

export { MIN_SIP_REREGISTER_INTERVAL_SEC };

/**
 * - Purpose: default v1 user settings for fresh install.
 * - Inputs: none.
 * - Outputs: validated UserSettings v1 aggregate.
 */
export function createDefaultUserSettings(): UserSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    theme: DEFAULT_APP_THEME,
    multiSessionsEnabled: true,
    autoUnholdOnTransferFailure: true,
    autoAnswerTimeoutSec: null,
    ringbackToneEnabled: true,
    sipAutoReregisterEnabled: true,
    sipReregisterIntervalSec: DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
    sipReregisterMaxAttempts: DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  };
}
