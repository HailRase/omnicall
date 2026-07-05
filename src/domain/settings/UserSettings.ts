import { DEFAULT_APP_THEME, type AppTheme } from "./AppTheme.js";
import {
  DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
  DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "./SipRecoverySettings.js";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  type SupportedLanguage,
} from "./SupportedLanguage.js";

export const SETTINGS_SCHEMA_VERSION = 2 as const;

export type SettingsSchemaVersion = typeof SETTINGS_SCHEMA_VERSION;

/** Max auto-answer delay (seconds) aligned with legacy operator UX. */
export const MAX_AUTO_ANSWER_TIMEOUT_SEC = 300;

export type UserSettings = Readonly<{
  schemaVersion: SettingsSchemaVersion;
  language: SupportedLanguage;
  theme: AppTheme;
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  autoAnswerTimeoutSec: number | null;
  autoAnswerDuringActiveSessionEnabled: boolean;
  ringbackToneEnabled: boolean;
  sipAutoReconnectEnabled: boolean;
  sipReconnectIntervalSec: number;
  sipReconnectMaxAttempts: number;
  sipAutoReregisterEnabled: boolean;
  sipReregisterIntervalSec: number;
  sipReregisterMaxAttempts: number;
  sipAutoRegisterOnStartup: boolean;
  /** Suppress startup update banner until manifest reports a newer version. */
  dismissedUpdateBannerVersion: string | null;
}>;

export { MIN_SIP_REREGISTER_INTERVAL_SEC, MIN_SIP_RECONNECT_INTERVAL_SEC };

/**
 * - Purpose: default v2 user settings for fresh install.
 * - Inputs: none.
 * - Outputs: validated UserSettings v2 aggregate.
 */
export function createDefaultUserSettings(): UserSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    language: DEFAULT_SUPPORTED_LANGUAGE,
    theme: DEFAULT_APP_THEME,
    multiSessionsEnabled: true,
    autoUnholdOnTransferFailure: true,
    autoAnswerTimeoutSec: null,
    autoAnswerDuringActiveSessionEnabled: false,
    ringbackToneEnabled: true,
    sipAutoReconnectEnabled: true,
    sipReconnectIntervalSec: DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
    sipReconnectMaxAttempts: DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
    sipAutoReregisterEnabled: true,
    sipReregisterIntervalSec: DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
    sipReregisterMaxAttempts: DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
    sipAutoRegisterOnStartup: false,
    dismissedUpdateBannerVersion: null,
  };
}
