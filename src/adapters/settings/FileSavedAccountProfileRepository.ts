import {
  parsePersistedSavedAccountProfilesDocument,
  serializeSavedAccountProfilesDocument,
  type SavedAccountProfile,
  type SavedAccountProfileId,
  type SavedAccountProfileInput,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { SavedAccountProfileRepository } from "@ports/settings/SavedAccountProfileRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import { InMemorySavedAccountProfileRepository } from "./InMemorySavedAccountProfileRepository.js";
import {
  resolveProfilesRootPath,
  resolveSavedAccountProfilesFilePath,
} from "./profileStoragePaths.js";

export type FileSavedAccountProfileRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  logger?: Logger;
}>;

/**
 * - Purpose: persist saved SIP account profile metadata on disk without secrets.
 * - Inputs: storage root, filesystem port, optional logger for corrupt-document warnings.
 * - Outputs: SavedAccountProfileRepository with atomic writes and conservative recovery.
 */
export class FileSavedAccountProfileRepository implements SavedAccountProfileRepository {
  private readonly memory = new InMemorySavedAccountProfileRepository();
  private readonly storageRoot: string;
  private readonly filesystem: FileSystemPort;
  private readonly logger: Logger | undefined;
  private persistStateLoaded = false;
  private persistStateLoadPromise: Promise<void> | null = null;

  constructor(options: FileSavedAccountProfileRepositoryOptions) {
    this.storageRoot = options.storageRoot;
    this.filesystem = options.filesystem;
    this.logger = options.logger;
  }

  async listProfiles(): Promise<ReadonlyArray<SavedAccountProfile>> {
    await this.ensurePersistedStateLoaded();
    return this.memory.listProfiles();
  }

  async saveProfile(input: SavedAccountProfileInput): Promise<SavedAccountProfile> {
    await this.ensurePersistedStateLoaded();
    const saved = await this.memory.saveProfile(input);
    await this.persistProfilesDocument();
    return saved;
  }

  async deleteProfile(profileId: SavedAccountProfileId): Promise<void> {
    await this.ensurePersistedStateLoaded();
    await this.memory.deleteProfile(profileId);
    await this.persistProfilesDocument();
  }

  async touchLastUsedAt(profileId: SavedAccountProfileId): Promise<void> {
    await this.ensurePersistedStateLoaded();
    await this.memory.touchLastUsedAt(profileId);
    await this.persistProfilesDocument();
  }

  async getProfileById(profileId: SavedAccountProfileId): Promise<SavedAccountProfile | null> {
    await this.ensurePersistedStateLoaded();
    return this.memory.getProfileById(profileId);
  }

  /** Test helper: seed corrupt JSON on disk. */
  async seedCorruptDocument(json: string): Promise<void> {
    await this.ensurePersistedStateLoaded();
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.writeTextFileAtomic(
      resolveSavedAccountProfilesFilePath(this.storageRoot),
      json,
    );
    this.persistStateLoaded = false;
    this.persistStateLoadPromise = null;
  }

  /** Test helper: read persisted saved-profiles JSON from disk. */
  async readPersistedDocument(): Promise<string | undefined> {
    await this.ensurePersistedStateLoaded();
    const json = await this.filesystem.readTextFile(
      resolveSavedAccountProfilesFilePath(this.storageRoot),
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

    const json = await this.filesystem.readTextFile(
      resolveSavedAccountProfilesFilePath(this.storageRoot),
    );
    if (json === null) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(json) as unknown;
    } catch {
      this.logCorruptDocument("invalid_json");
      return;
    }

    const documentResult = parsePersistedSavedAccountProfilesDocument(parsed);
    if (!documentResult.ok) {
      this.logCorruptDocument(documentResult.error.code);
      return;
    }

    this.memory.replaceProfiles(documentResult.value.profiles);
  }

  private async persistProfilesDocument(): Promise<void> {
    const profiles = await this.memory.listProfiles();
    const serialized = serializeSavedAccountProfilesDocument(profiles);
    assertPersistedProfileJsonExcludesSecrets(serialized);

    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.writeTextFileAtomic(
      resolveSavedAccountProfilesFilePath(this.storageRoot),
      serialized,
    );
  }

  private logCorruptDocument(reason: string): void {
    this.logger?.warn("saved_account_profiles_document_corrupt", {
      featureId: "F-024",
      boundedContext: "Settings",
      operation: "load_saved_account_profiles",
      result: reason,
    });
  }
}
