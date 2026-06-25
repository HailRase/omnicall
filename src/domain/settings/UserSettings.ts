export const SETTINGS_SCHEMA_VERSION = 1 as const;

export type SettingsSchemaVersion = typeof SETTINGS_SCHEMA_VERSION;

/** Max auto-answer delay (seconds) aligned with legacy operator UX. */
export const MAX_AUTO_ANSWER_TIMEOUT_SEC = 300;

export type UserSettings = Readonly<{
  schemaVersion: SettingsSchemaVersion;
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  autoAnswerTimeoutSec: number | null;
  ringbackToneEnabled: boolean;
}>;

/**
 * - Purpose: default v1 user settings for fresh install.
 * - Inputs: none.
 * - Outputs: validated UserSettings v1 aggregate.
 */
export function createDefaultUserSettings(): UserSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    multiSessionsEnabled: true,
    autoUnholdOnTransferFailure: true,
    autoAnswerTimeoutSec: null,
    ringbackToneEnabled: true,
  };
}
