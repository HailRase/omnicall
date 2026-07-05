import {
  createSettingsAccountKey,
  type SettingsAccountKey,
  type UserSettings,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { SettingsRepository } from "@ports/index.js";
import {
  InMemorySettingsRepository,
  type InMemorySettingsState,
} from "./InMemorySettingsRepository.js";
import { parsePersistedUserSettingsJson } from "./parsePersistedUserSettings.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import {
  decodeProfileKeyFromFileName,
  resolveProfileSettingsDirectoryPath,
  resolveProfileSettingsFilePath,
  resolveProfilesIndexPath,
  resolveProfilesRootPath,
} from "./profileStoragePaths.js";
import {
  parseProfilesIndex,
  PROFILES_INDEX_SCHEMA_VERSION,
  serializeProfilesIndex,
  type ProfilesIndexDocumentV1,
} from "./profilesIndexDocument.js";

export type FileSettingsRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  initial?: Partial<InMemorySettingsState>;
}>;

/**
 * - Purpose: persist per-profile UserSettings and active profile index on disk.
 * - Inputs: storage root, filesystem port, optional in-memory session seed.
 * - Outputs: SettingsRepository with validated JSON boundary and atomic writes.
 */
export class FileSettingsRepository implements SettingsRepository {
  private readonly memory: InMemorySettingsRepository;
  private readonly storageRoot: string;
  private readonly filesystem: FileSystemPort;
  private persistStateLoaded = false;
  private persistStateLoadPromise: Promise<void> | null = null;

  constructor(options: FileSettingsRepositoryOptions) {
    this.storageRoot = options.storageRoot;
    this.filesystem = options.filesystem;
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
    await this.ensurePersistedStateLoaded();

    const filePath = resolveProfileSettingsFilePath(this.storageRoot, accountKey);
    const json = await this.filesystem.readTextFile(filePath);
    if (json === null) {
      return this.memory.getUserSettings(accountKey);
    }

    return parsePersistedUserSettingsJson(json);
  }

  async saveUserSettings(
    accountKey: SettingsAccountKey,
    settings: UserSettings,
  ): Promise<void> {
    await this.ensurePersistedStateLoaded();
    await this.memory.saveUserSettings(accountKey, settings);

    const filePath = resolveProfileSettingsFilePath(this.storageRoot, accountKey);
    await this.filesystem.ensureDirectory(
      resolveProfileSettingsDirectoryPath(this.storageRoot),
    );
    const serializedSettings = JSON.stringify(settings);
    assertPersistedProfileJsonExcludesSecrets(serializedSettings);
    await this.filesystem.writeTextFileAtomic(filePath, serializedSettings);
  }

  async getActiveProfileKey(): Promise<SettingsAccountKey> {
    await this.ensurePersistedStateLoaded();
    return this.memory.getActiveProfileKey();
  }

  async setActiveProfileKey(
    accountKey: Parameters<SettingsRepository["setActiveProfileKey"]>[0],
  ): Promise<void> {
    await this.ensurePersistedStateLoaded();
    await this.memory.setActiveProfileKey(accountKey);
    await this.persistActiveProfileKey(accountKey);
  }

  async listKnownProfileKeys(): Promise<ReadonlyArray<SettingsAccountKey>> {
    await this.ensurePersistedStateLoaded();

    const memoryKeys = await this.memory.listKnownProfileKeys();
    const diskKeys = await this.listProfileKeysFromDisk();
    const merged = new Set<SettingsAccountKey>([...memoryKeys, ...diskKeys]);
    return [...merged].sort((left, right) => left.localeCompare(right));
  }

  /** Test helper: seed corrupt JSON for an account key on disk. */
  async seedCorruptJson(accountKey: string, json: string): Promise<void> {
    await this.ensurePersistedStateLoaded();
    const key = createSettingsAccountKey(accountKey);
    const filePath = resolveProfileSettingsFilePath(this.storageRoot, key);
    await this.filesystem.ensureDirectory(
      resolveProfileSettingsDirectoryPath(this.storageRoot),
    );
    await this.filesystem.writeTextFileAtomic(filePath, json);
  }

  /** Test helper: read persisted JSON for an account key from disk. */
  async readPersistedJson(accountKey: SettingsAccountKey): Promise<string | undefined> {
    await this.ensurePersistedStateLoaded();
    const json = await this.filesystem.readTextFile(
      resolveProfileSettingsFilePath(this.storageRoot, accountKey),
    );
    return json ?? undefined;
  }

  private ensurePersistedStateLoaded(): Promise<void> {
    if (this.persistStateLoaded) {
      return Promise.resolve();
    }

    this.persistStateLoadPromise ??= this.loadPersistedState().finally(() => {
      this.persistStateLoaded = true;
    });
    return this.persistStateLoadPromise;
  }

  private async loadPersistedState(): Promise<void> {
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileSettingsDirectoryPath(this.storageRoot),
    );

    const indexJson = await this.filesystem.readTextFile(
      resolveProfilesIndexPath(this.storageRoot),
    );
    if (indexJson === null) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(indexJson) as unknown;
    } catch {
      return;
    }

    const indexResult = parseProfilesIndex(parsed);
    if (!indexResult.ok || indexResult.value.activeProfileKey === null) {
      return;
    }

    await this.memory.setActiveProfileKey(
      createSettingsAccountKey(indexResult.value.activeProfileKey),
    );
  }

  private async persistActiveProfileKey(accountKey: SettingsAccountKey): Promise<void> {
    const document: ProfilesIndexDocumentV1 = {
      schemaVersion: PROFILES_INDEX_SCHEMA_VERSION,
      activeProfileKey: accountKey,
    };

    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    const serializedIndex = serializeProfilesIndex(document);
    assertPersistedProfileJsonExcludesSecrets(serializedIndex);
    await this.filesystem.writeTextFileAtomic(
      resolveProfilesIndexPath(this.storageRoot),
      serializedIndex,
    );
  }

  private async listProfileKeysFromDisk(): Promise<ReadonlyArray<SettingsAccountKey>> {
    const files = await this.filesystem.listFiles(
      resolveProfileSettingsDirectoryPath(this.storageRoot),
    );
    const keys: SettingsAccountKey[] = [];

    for (const fileName of files) {
      if (!fileName.endsWith(".json")) {
        continue;
      }

      const encodedKey = fileName.slice(0, -".json".length);
      const decodedKey = decodeProfileKeyFromFileName(encodedKey);
      if (decodedKey !== null) {
        keys.push(decodedKey);
      }
    }

    return keys;
  }
}
