import {
  migrateUserSettings as migrateUserSettingsDomain,
  type SettingsMigrationError,
  type UserSettingsV0Legacy,
} from "@domain/settings/migrateUserSettings.js";
import type { UserSettings } from "@domain/settings/UserSettings.js";
import { createPlatformError, type PlatformError } from "@shared/errors/index.js";
import { err, ok, type Result } from "@shared/result/index.js";

export type { UserSettingsV0Legacy, SettingsMigrationError };

/**
 * - Purpose: application-layer Result wrapper for settings migration.
 * - Inputs: unknown raw blob and optional v0 legacy fragments.
 * - Outputs: Result with UserSettings v1 or platform error.
 */
export function migrateUserSettings(
  raw: unknown,
  legacy?: UserSettingsV0Legacy,
): Result<UserSettings, PlatformError> {
  const result = migrateUserSettingsDomain(raw, legacy);
  if (!result.ok) {
    return err(
      createPlatformError(
        "validation_failed",
        `${result.error.code}:${result.error.message}`,
        result.error,
      ),
    );
  }
  return ok(result.value);
}
