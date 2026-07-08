import type { CallHistoryEntry } from "@domain/index.js";
import {
  parsePersistedCallHistoryDocument,
  serializeCallHistoryDocument,
  type SettingsAccountKey,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { CallHistoryRepository } from "@ports/settings/CallHistoryRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import { InMemoryCallHistoryRepository } from "./InMemoryCallHistoryRepository.js";
import type { ResolveSettingsAccountKey } from "./FileContactRepository.js";
import {
  resolveProfileCallHistoryDirectoryPath,
  resolveProfileCallHistoryFilePath,
  resolveProfilesRootPath,
} from "./profileStoragePaths.js";

export type FileCallHistoryRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  resolveAccountKey: ResolveSettingsAccountKey;
  logger?: Logger;
}>;

/**
 * - Purpose: persist call history per SettingsAccountKey on disk.
 * - Inputs: storage root, filesystem port, active account key resolver.
 * - Outputs: CallHistoryRepository with validated JSON boundary and atomic writes.
 */
export class FileCallHistoryRepository implements CallHistoryRepository {
  private readonly storageRoot: string;
  private readonly filesystem: FileSystemPort;
  private readonly resolveAccountKey: ResolveSettingsAccountKey;
  private readonly logger: Logger | undefined;
  private readonly accountMemory = new Map<SettingsAccountKey, InMemoryCallHistoryRepository>();
  private readonly loadedAccounts = new Set<SettingsAccountKey>();

  constructor(options: FileCallHistoryRepositoryOptions) {
    this.storageRoot = options.storageRoot;
    this.filesystem = options.filesystem;
    this.resolveAccountKey = options.resolveAccountKey;
    this.logger = options.logger;
  }

  async listEntries(): Promise<ReadonlyArray<CallHistoryEntry>> {
    const memory = await this.getActiveAccountMemory();
    return memory.listEntries();
  }

  async appendEntry(
    entry: Parameters<CallHistoryRepository["appendEntry"]>[0],
  ): Promise<void> {
    const accountKey = await this.resolveAccountKey();
    const memory = await this.getAccountMemory(accountKey);
    await memory.appendEntry(entry);
    await this.persistAccountHistory(accountKey, memory);
  }

  async getEntryById(
    entryId: Parameters<CallHistoryRepository["getEntryById"]>[0],
  ): Promise<CallHistoryEntry | null> {
    const memory = await this.getActiveAccountMemory();
    return memory.getEntryById(entryId);
  }

  /** Test helper: seed corrupt JSON for one account key on disk. */
  async seedCorruptJson(accountKey: SettingsAccountKey, json: string): Promise<void> {
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileCallHistoryDirectoryPath(this.storageRoot),
    );
    await this.filesystem.writeTextFileAtomic(
      resolveProfileCallHistoryFilePath(this.storageRoot, accountKey),
      json,
    );
    this.loadedAccounts.delete(accountKey);
    this.accountMemory.delete(accountKey);
  }

  /** Test helper: read persisted JSON for one account key from disk. */
  async readPersistedJson(accountKey: SettingsAccountKey): Promise<string | undefined> {
    await this.getAccountMemory(accountKey);
    const json = await this.filesystem.readTextFile(
      resolveProfileCallHistoryFilePath(this.storageRoot, accountKey),
    );
    return json ?? undefined;
  }

  private async getActiveAccountMemory(): Promise<InMemoryCallHistoryRepository> {
    const accountKey = await this.resolveAccountKey();
    return this.getAccountMemory(accountKey);
  }

  private async getAccountMemory(
    accountKey: SettingsAccountKey,
  ): Promise<InMemoryCallHistoryRepository> {
    if (!this.loadedAccounts.has(accountKey)) {
      await this.loadAccountHistory(accountKey);
    }

    let memory = this.accountMemory.get(accountKey);
    if (memory === undefined) {
      memory = new InMemoryCallHistoryRepository();
      this.accountMemory.set(accountKey, memory);
    }

    return memory;
  }

  private async loadAccountHistory(accountKey: SettingsAccountKey): Promise<void> {
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileCallHistoryDirectoryPath(this.storageRoot),
    );

    const memory = new InMemoryCallHistoryRepository();
    const json = await this.filesystem.readTextFile(
      resolveProfileCallHistoryFilePath(this.storageRoot, accountKey),
    );

    if (json !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json) as unknown;
      } catch {
        this.logCorruptDocument(accountKey, "invalid_json");
      }

      if (parsed !== undefined) {
        const documentResult = parsePersistedCallHistoryDocument(parsed);
        if (!documentResult.ok) {
          this.logCorruptDocument(accountKey, documentResult.error.code);
        } else {
          memory.replaceEntries(documentResult.value.entries);
        }
      }
    }

    this.accountMemory.set(accountKey, memory);
    this.loadedAccounts.add(accountKey);
  }

  private async persistAccountHistory(
    accountKey: SettingsAccountKey,
    memory: InMemoryCallHistoryRepository,
  ): Promise<void> {
    const entries = await memory.listEntries();
    const serialized = serializeCallHistoryDocument(entries);
    assertPersistedProfileJsonExcludesSecrets(serialized);

    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileCallHistoryDirectoryPath(this.storageRoot),
    );
    await this.filesystem.writeTextFileAtomic(
      resolveProfileCallHistoryFilePath(this.storageRoot, accountKey),
      serialized,
    );
  }

  private logCorruptDocument(accountKey: SettingsAccountKey, reason: string): void {
    this.logger?.warn("call_history_document_corrupt", {
      featureId: "F-013",
      boundedContext: "Settings",
      operation: "load_call_history",
      accountKey,
      result: reason,
    });
  }
}
