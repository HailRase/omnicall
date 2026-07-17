import {
  parsePersistedSavedAccountProfilesDocument,
  serializeSavedAccountProfilesDocument,
  type SavedAccountProfile,
  type SavedAccountProfileId,
  type SavedAccountProfileInput,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type {
  SavedAccountProfileRepository,
  SaveSavedAccountProfileOptions,
} from "@ports/settings/SavedAccountProfileRepository.js";
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
  private corruptDocumentDetected = false;

  constructor(options: FileSavedAccountProfileRepositoryOptions) {
    this.storageRoot = options.storageRoot;
    this.filesystem = options.filesystem;
    this.logger = options.logger;
  }

  async listProfiles(): Promise<ReadonlyArray<SavedAccountProfile>> {
    await this.ensurePersistedStateLoaded();
    return this.memory.listProfiles();
  }

  async saveProfile(
    input: SavedAccountProfileInput,
    options?: SaveSavedAccountProfileOptions,
  ): Promise<SavedAccountProfile> {
    await this.ensurePersistedStateLoaded();
    const snapshot = await this.memory.listProfiles();
    try {
      const saved = await this.memory.saveProfile(input, options);
      await this.persistProfilesDocument();
      return saved;
    } catch (error: unknown) {
      this.memory.replaceProfiles(snapshot);
      throw error;
    }
  }

  async deleteProfile(profileId: SavedAccountProfileId): Promise<void> {
    await this.ensurePersistedStateLoaded();
    const snapshot = await this.memory.listProfiles();
    try {
      await this.memory.deleteProfile(profileId);
      await this.persistProfilesDocument();
    } catch (error: unknown) {
      this.memory.replaceProfiles(snapshot);
      throw error;
    }
  }

  async touchLastUsedAt(profileId: SavedAccountProfileId): Promise<void> {
    await this.ensurePersistedStateLoaded();
    const snapshot = await this.memory.listProfiles();
    try {
      await this.memory.touchLastUsedAt(profileId);
      await this.persistProfilesDocument();
    } catch (error: unknown) {
      this.memory.replaceProfiles(snapshot);
      throw error;
    }
  }

  async markProfileSuccessful(
    profileId: SavedAccountProfileId,
    successfulUseAt: string,
  ): Promise<SavedAccountProfile | null> {
    await this.ensurePersistedStateLoaded();
    const snapshot = await this.memory.listProfiles();
    try {
      const promoted = await this.memory.markProfileSuccessful(profileId, successfulUseAt);
      if (promoted !== null) {
        await this.persistProfilesDocument();
      }
      return promoted;
    } catch (error: unknown) {
      this.memory.replaceProfiles(snapshot);
      throw error;
    }
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
      this.corruptDocumentDetected = false;
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(json) as unknown;
    } catch {
      this.corruptDocumentDetected = true;
      this.logCorruptDocument("invalid_json");
      return;
    }

    const documentResult = parsePersistedSavedAccountProfilesDocument(parsed);
    if (!documentResult.ok) {
      this.corruptDocumentDetected = true;
      this.logCorruptDocument(documentResult.error.code);
      return;
    }

    this.corruptDocumentDetected = false;
    this.memory.replaceProfiles(documentResult.value.profiles);
  }

  private async persistProfilesDocument(): Promise<void> {
    if (this.corruptDocumentDetected) {
      throw new Error("saved_account_profiles_document_requires_recovery");
    }
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
