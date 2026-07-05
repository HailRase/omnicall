import type { SettingsAccountKey } from "@domain/index.js";
import type { CodecPreferences } from "@domain/index.js";
import { resolveSettingsAccountKeyFromSipAccount } from "@domain/index.js";
import type { CodecPreferencesPort, SettingsRepository } from "@ports/index.js";

export type SettingsRepositoryCodecPreferencesAdapterOptions = Readonly<{
  settingsRepository: SettingsRepository;
  resolveAccountKey?: () => Promise<SettingsAccountKey>;
}>;

/**
 * - Purpose: expose UserSettings.codecPreferences via CodecPreferencesPort.
 * - Inputs: settings repository and optional account key resolver.
 * - Outputs: current user codec preferences on each getCodecPreferences call.
 */
export class SettingsRepositoryCodecPreferencesAdapter implements CodecPreferencesPort {
  private readonly settingsRepository: SettingsRepository;
  private readonly resolveAccountKey: () => Promise<SettingsAccountKey>;

  constructor(options: SettingsRepositoryCodecPreferencesAdapterOptions) {
    this.settingsRepository = options.settingsRepository;
    this.resolveAccountKey =
      options.resolveAccountKey ??
      (async () => {
        const [account, activeProfileKey] = await Promise.all([
          this.settingsRepository.getSipAccount(),
          this.settingsRepository.getActiveProfileKey(),
        ]);
        if (account === null) {
          return activeProfileKey;
        }
        const identityKey = resolveSettingsAccountKeyFromSipAccount(account);
        return activeProfileKey === identityKey ? activeProfileKey : identityKey;
      });
  }

  async getCodecPreferences(): Promise<CodecPreferences> {
    const accountKey = await this.resolveAccountKey();
    const settings = await this.settingsRepository.getUserSettings(accountKey);
    return settings.codecPreferences;
  }
}
