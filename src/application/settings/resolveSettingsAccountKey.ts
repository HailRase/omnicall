import type { SettingsRepository } from "@ports/index.js";
import {
  resolveSettingsAccountKeyFromSipAccount,
  type SettingsAccountKey,
} from "@domain/index.js";

/**
 * - Purpose: resolve active UserSettings bucket from repository state.
 * - Inputs: settings repository with SIP account and active profile metadata.
 * - Outputs: branded SettingsAccountKey aligned with authorized identity when set.
 */
export async function resolveSettingsAccountKey(
  settingsRepository: SettingsRepository,
): Promise<SettingsAccountKey> {
  const [account, activeProfileKey] = await Promise.all([
    settingsRepository.getSipAccount(),
    settingsRepository.getActiveProfileKey(),
  ]);

  if (account === null) {
    return activeProfileKey;
  }

  const identityKey = resolveSettingsAccountKeyFromSipAccount(account);
  if (activeProfileKey === identityKey) {
    return activeProfileKey;
  }

  return identityKey;
}
