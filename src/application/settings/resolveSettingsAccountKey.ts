import type { SettingsRepository } from "@ports/index.js";
import {
  resolveSettingsAccountKeyFromSipAccount,
  type SettingsAccountKey,
} from "@domain/index.js";

/**
 * - Purpose: async helper to resolve settings account key via repository.
 * - Inputs: settings repository with current SIP account snapshot.
 * - Outputs: branded SettingsAccountKey for UserSettings lookups.
 */
export async function resolveSettingsAccountKey(
  settingsRepository: SettingsRepository,
): Promise<SettingsAccountKey> {
  const account = await settingsRepository.getSipAccount();
  return resolveSettingsAccountKeyFromSipAccount(account);
}
