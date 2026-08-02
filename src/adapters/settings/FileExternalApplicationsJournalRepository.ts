/**
 * - Purpose: persist External Applications journal entries per profile on disk.
 * - Inputs: storage root, filesystem port, and profile-scoped journal commands.
 * - Outputs: ExternalApplicationsJournalRepository with atomic append.
 */

import type {
  ExternalApplicationJournalEntry,
  SettingsAccountKey,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { ExternalApplicationsJournalRepository } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import { EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import { InMemoryExternalApplicationsJournalRepository } from "../mock/InMemoryExternalApplicationsJournalRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import {
  parseExternalApplicationsJournalDocument,
  serializeExternalApplicationsJournalDocument,
} from "./externalApplicationsJournalDocument.js";
import {
  resolveExternalApplicationsJournalDirectoryPath,
  resolveExternalApplicationsJournalFilePath,
  resolveProfilesRootPath,
} from "./profileStoragePaths.js";

export type FileExternalApplicationsJournalRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  logger?: Logger;
}>;

export class FileExternalApplicationsJournalRepository
  implements ExternalApplicationsJournalRepository
{
  private readonly memory = new InMemoryExternalApplicationsJournalRepository();
  private readonly loadedProfiles = new Set<SettingsAccountKey>();
  private readonly corruptProfiles = new Set<SettingsAccountKey>();

  constructor(
    private readonly options: FileExternalApplicationsJournalRepositoryOptions,
  ) {}

  async list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalApplicationJournalEntry>> {
    await this.ensureLoaded(profileKey);
    this.assertNotCorrupt(profileKey);
    return this.memory.list(profileKey, limit);
  }

  async append(
    profileKey: SettingsAccountKey,
    entry: ExternalApplicationJournalEntry,
  ): Promise<void> {
    await this.ensureLoaded(profileKey);
    this.assertNotCorrupt(profileKey);
    const snapshot = await this.memory.list(
      profileKey,
      EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES,
    );
    try {
      await this.memory.append(profileKey, entry);
      await this.persist(profileKey);
    } catch (error: unknown) {
      this.memory.replaceEntries(profileKey, snapshot);
      throw error instanceof Error
        ? error
        : new Error("external_applications_journal_append_failed");
    }
  }

  private async ensureLoaded(profileKey: SettingsAccountKey): Promise<void> {
    if (this.loadedProfiles.has(profileKey) || this.corruptProfiles.has(profileKey)) {
      return;
    }
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.ensureDirectory(
      resolveExternalApplicationsJournalDirectoryPath(this.options.storageRoot),
    );
    const json = await this.options.filesystem.readTextFile(
      resolveExternalApplicationsJournalFilePath(this.options.storageRoot, profileKey),
    );
    if (json === null) {
      this.loadedProfiles.add(profileKey);
      return;
    }
    this.loadJson(profileKey, json);
  }

  private loadJson(profileKey: SettingsAccountKey, json: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json) as unknown;
    } catch {
      this.markCorrupt(profileKey, "invalid_json");
      return;
    }
    const result = parseExternalApplicationsJournalDocument(parsed);
    if (!result.ok) {
      this.markCorrupt(profileKey, result.error.code);
      return;
    }
    this.memory.replaceEntries(profileKey, result.value.entries);
    this.loadedProfiles.add(profileKey);
  }

  private async persist(profileKey: SettingsAccountKey): Promise<void> {
    const entries = await this.memory.list(
      profileKey,
      EXTERNAL_APPLICATIONS_JOURNAL_MAX_ENTRIES,
    );
    const serialized = serializeExternalApplicationsJournalDocument(entries);
    assertPersistedProfileJsonExcludesSecrets(serialized);
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.ensureDirectory(
      resolveExternalApplicationsJournalDirectoryPath(this.options.storageRoot),
    );
    await this.options.filesystem.writeTextFileAtomic(
      resolveExternalApplicationsJournalFilePath(this.options.storageRoot, profileKey),
      serialized,
    );
  }

  private assertNotCorrupt(profileKey: SettingsAccountKey): void {
    if (!this.corruptProfiles.has(profileKey)) {
      return;
    }
    throw new Error("external_applications_journal_document_requires_recovery");
  }

  private markCorrupt(profileKey: SettingsAccountKey, reason: string): void {
    this.corruptProfiles.add(profileKey);
    this.options.logger?.warn("external_applications_journal_document_corrupt", {
      featureId: "F-032",
      boundedContext: "Integration",
      operation: "load_external_applications_journal",
      result: reason,
    });
  }
}
