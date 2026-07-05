import { migrateUserSettings, type UserSettings } from "@domain/index.js";

/**
 * - Purpose: parse persisted UserSettings JSON at adapter boundary.
 * - Inputs: raw JSON text from profile settings file.
 * - Outputs: migrated and validated UserSettings aggregate.
 */
export function parsePersistedUserSettingsJson(json: string): UserSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error("settings_corrupt:invalid_json");
  }

  const migrated = migrateUserSettings(parsed);
  if (!migrated.ok) {
    throw new Error(`settings_corrupt:${migrated.error.code}:${migrated.error.message}`);
  }

  return migrated.value;
}
