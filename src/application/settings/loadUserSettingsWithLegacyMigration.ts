import {
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  isCompositeSettingsAccountKey,
  type SettingsAccountIdentity,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { Logger, SettingsRepository } from "@ports/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";

export type LoadUserSettingsWithLegacyMigrationInput = Readonly<{
  settingsRepository: SettingsRepository;
  compositeAccountKey: SettingsAccountKey;
  identity: SettingsAccountIdentity;
  logger?: Logger;
}>;

/**
 * - Purpose: load UserSettings with one-time username-only to composite key migration.
 * - Inputs: repository, composite profile key, SIP identity, optional logger.
 * - Outputs: UserSettings from composite bucket or migrated legacy copy.
 */
export async function loadUserSettingsWithLegacyMigration(
  input: LoadUserSettingsWithLegacyMigrationInput,
): Promise<UserSettings> {
  const { settingsRepository, compositeAccountKey, identity, logger } = input;

  const knownKeys = await settingsRepository.listKnownProfileKeys();
  if (knownKeys.includes(compositeAccountKey)) {
    return settingsRepository.getUserSettings(compositeAccountKey);
  }

  if (!isCompositeSettingsAccountKey(compositeAccountKey)) {
    return settingsRepository.getUserSettings(compositeAccountKey);
  }

  const legacyAccountKey = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(identity);
  if (
    legacyAccountKey === compositeAccountKey ||
    !knownKeys.includes(legacyAccountKey)
  ) {
    return settingsRepository.getUserSettings(compositeAccountKey);
  }

  try {
    const legacySettings = await settingsRepository.getUserSettings(legacyAccountKey);
    await settingsRepository.saveUserSettings(compositeAccountKey, legacySettings);

    const activeProfileKey = await settingsRepository.getActiveProfileKey();
    if (activeProfileKey === legacyAccountKey) {
      await settingsRepository.setActiveProfileKey(compositeAccountKey);
    }

    logger?.info("settings_profile_key_migrated", {
      featureId: "F-023",
      boundedContext: "Settings",
      operation: "migrate_legacy_username_profile_key",
      sourceKey: legacyAccountKey,
      targetKey: compositeAccountKey,
      result: "succeeded",
    });

    return legacySettings;
  } catch (error: unknown) {
    const normalized = normalizeUnknownError(error);
    logger?.warn("settings_profile_key_migration_failed", {
      featureId: "F-023",
      boundedContext: "Settings",
      operation: "migrate_legacy_username_profile_key",
      sourceKey: legacyAccountKey,
      targetKey: compositeAccountKey,
      result: normalized.message,
    });
    return settingsRepository.getUserSettings(compositeAccountKey);
  }
}
