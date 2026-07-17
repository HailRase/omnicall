import {
  parsePersistedUserNotificationJournalDocument,
  serializeUserNotificationJournalDocument,
  type UserNotificationJournalEntry,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { UserNotificationJournalRepository } from "@ports/settings/UserNotificationJournalRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import { InMemoryUserNotificationJournalRepository } from "./InMemoryUserNotificationJournalRepository.js";
import {
  resolveProfilesRootPath,
  resolveUserNotificationJournalFilePath,
} from "./profileStoragePaths.js";

export type FileUserNotificationJournalRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  logger?: Logger;
}>;

export class FileUserNotificationJournalRepository
  implements UserNotificationJournalRepository
{
  private readonly memory = new InMemoryUserNotificationJournalRepository();
  private loaded = false;
  private corruptDocumentDetected = false;

  constructor(
    private readonly options: FileUserNotificationJournalRepositoryOptions,
  ) {}

  async listEntries(
    nowMs: number = Date.now(),
  ): Promise<ReadonlyArray<UserNotificationJournalEntry>> {
    await this.ensureLoaded(nowMs);
    const entries = await this.memory.listEntries(nowMs);
    await this.persist(entries, nowMs);
    return entries;
  }

  async appendEntry(
    entry: UserNotificationJournalEntry,
    nowMs: number = Date.now(),
  ): Promise<void> {
    await this.ensureLoaded(nowMs);
    const snapshot = await this.memory.listEntries(nowMs);
    try {
      await this.memory.appendEntry(entry, nowMs);
      await this.persist(await this.memory.listEntries(nowMs), nowMs);
    } catch (error: unknown) {
      this.memory.replaceEntries(snapshot);
      throw error;
    }
  }

  async clearEntries(): Promise<void> {
    await this.ensureLoaded(Date.now());
    const snapshot = await this.memory.listEntries();
    try {
      await this.memory.clearEntries();
      await this.persist([], Date.now());
    } catch (error: unknown) {
      this.memory.replaceEntries(snapshot);
      throw error;
    }
  }

  private async ensureLoaded(nowMs: number): Promise<void> {
    if (this.loaded) {
      return;
    }
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    const json = await this.options.filesystem.readTextFile(
      resolveUserNotificationJournalFilePath(this.options.storageRoot),
    );
    if (json !== null) {
      this.loadJson(json, nowMs);
    }
    this.loaded = true;
  }

  private loadJson(json: string, nowMs: number): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json) as unknown;
    } catch {
      this.markCorrupt("invalid_json");
      return;
    }
    const result = parsePersistedUserNotificationJournalDocument(parsed, nowMs);
    if (!result.ok) {
      this.markCorrupt(result.error.code);
      return;
    }
    this.memory.replaceEntries(result.value.entries);
  }

  private async persist(
    entries: ReadonlyArray<UserNotificationJournalEntry>,
    nowMs: number,
  ): Promise<void> {
    if (this.corruptDocumentDetected) {
      throw new Error("notification_journal_document_requires_recovery");
    }
    const serialized = serializeUserNotificationJournalDocument(entries, nowMs);
    assertPersistedProfileJsonExcludesSecrets(serialized);
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.writeTextFileAtomic(
      resolveUserNotificationJournalFilePath(this.options.storageRoot),
      serialized,
    );
  }

  private markCorrupt(reason: string): void {
    this.corruptDocumentDetected = true;
    this.options.logger?.warn("notification_journal_document_corrupt", {
      featureId: "F-029",
      boundedContext: "Settings",
      operation: "load_notification_journal",
      result: reason,
    });
  }
}
