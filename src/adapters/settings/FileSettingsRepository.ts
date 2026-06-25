import type { SettingsAccountKey, UserSettings } from "@domain/index.js";
import { createSettingsAccountKey, migrateUserSettings } from "@domain/index.js";
import {
  InMemorySettingsRepository,
  type InMemorySettingsState,
} from "./InMemorySettingsRepository.js";
import type { SettingsRepository } from "@ports/index.js";

export type FileSettingsRepositoryOptions = Readonly<{
  initial?: Partial<InMemorySettingsState>;
}>;

/**
 * - Purpose: file-backed user settings stub with in-memory fallback for tests.
 * - Inputs: optional initial in-memory state; JSON blobs per account key.
 * - Outputs: SettingsRepository with validated read/write at JSON boundary.
 */
export class FileSettingsRepository implements SettingsRepository {
  private readonly memory: InMemorySettingsRepository;
  private readonly persistedJson = new Map<SettingsAccountKey, string>();

  constructor(options: FileSettingsRepositoryOptions = {}) {
    this.memory = new InMemorySettingsRepository(options.initial);
  }

  getBootstrapConfig(): ReturnType<InMemorySettingsRepository["getBootstrapConfig"]> {
    return this.memory.getBootstrapConfig();
  }

  getSipAccount(): ReturnType<InMemorySettingsRepository["getSipAccount"]> {
    return this.memory.getSipAccount();
  }

  saveSipAccount(
    account: Parameters<SettingsRepository["saveSipAccount"]>[0],
  ): Promise<void> {
    return this.memory.saveSipAccount(account);
  }

  getPhoneStatus(): ReturnType<InMemorySettingsRepository["getPhoneStatus"]> {
    return this.memory.getPhoneStatus();
  }

  setPhoneStatus(status: Parameters<SettingsRepository["setPhoneStatus"]>[0]): Promise<void> {
    return this.memory.setPhoneStatus(status);
  }

  getIncomingCallSettings(): ReturnType<InMemorySettingsRepository["getIncomingCallSettings"]> {
    return this.memory.getIncomingCallSettings();
  }

  setAllowedBreakReasons(
    reasons: Parameters<SettingsRepository["setAllowedBreakReasons"]>[0],
  ): Promise<void> {
    return this.memory.setAllowedBreakReasons(reasons);
  }

  getMultiCallSettings(): ReturnType<InMemorySettingsRepository["getMultiCallSettings"]> {
    return this.memory.getMultiCallSettings();
  }

  setMultiCallSettings(
    settings: Parameters<SettingsRepository["setMultiCallSettings"]>[0],
  ): Promise<void> {
    return this.memory.setMultiCallSettings(settings);
  }

  async getUserSettings(accountKey: SettingsAccountKey): Promise<UserSettings> {
    const json = this.persistedJson.get(accountKey);
    if (json === undefined) {
      return this.memory.getUserSettings(accountKey);
    }

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

  async saveUserSettings(
    accountKey: SettingsAccountKey,
    settings: UserSettings,
  ): Promise<void> {
    await this.memory.saveUserSettings(accountKey, settings);
    this.persistedJson.set(accountKey, JSON.stringify(settings));
  }

  /** Test helper: seed corrupt JSON for an account key. */
  seedCorruptJson(accountKey: string, json: string): void {
    this.persistedJson.set(createSettingsAccountKey(accountKey), json);
  }

  /** Test helper: read persisted JSON for an account key. */
  readPersistedJson(accountKey: SettingsAccountKey): string | undefined {
    return this.persistedJson.get(accountKey);
  }
}
