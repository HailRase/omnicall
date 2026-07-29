/**
 * - Purpose: persist External Services journal entries per profile on disk.
 * - Inputs: storage root, filesystem port, and profile-scoped journal commands.
 * - Outputs: ExternalServicesJournalRepository with atomic append and fail-visible corrupt loads.
 */

import type { ExternalServiceJournalEntry, SettingsAccountKey } from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import { EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES } from "@ports/integration/ExternalServicesJournalRepository.js";
import { InMemoryExternalServicesJournalRepository } from "../mock/InMemoryExternalServicesJournalRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import {
  parseExternalServicesJournalDocument,
  serializeExternalServicesJournalDocument,
} from "./externalServicesJournalDocument.js";
import {
  resolveExternalServicesJournalDirectoryPath,
  resolveExternalServicesJournalFilePath,
  resolveProfilesRootPath,
} from "./profileStoragePaths.js";

export type FileExternalServicesJournalRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  logger?: Logger;
}>;

export class FileExternalServicesJournalRepository
  implements ExternalServicesJournalRepository
{
  private readonly memory = new InMemoryExternalServicesJournalRepository();
  private readonly loadedProfiles = new Set<SettingsAccountKey>();
  private readonly corruptProfiles = new Set<SettingsAccountKey>();

  constructor(
    private readonly options: FileExternalServicesJournalRepositoryOptions,
  ) {}

  async list(
    profileKey: SettingsAccountKey,
    limit: number,
  ): Promise<ReadonlyArray<ExternalServiceJournalEntry>> {
    await this.ensureLoaded(profileKey);
    this.assertNotCorrupt(profileKey);
    return this.memory.list(profileKey, limit);
  }

  async append(
    profileKey: SettingsAccountKey,
    entry: ExternalServiceJournalEntry,
  ): Promise<void> {
    await this.ensureLoaded(profileKey);
    this.assertNotCorrupt(profileKey);
    const snapshot = await this.memory.list(
      profileKey,
      EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES,
    );
    try {
      await this.memory.append(profileKey, entry);
      await this.persist(profileKey);
    } catch (error: unknown) {
      this.memory.replaceEntries(profileKey, snapshot);
      throw error instanceof Error
        ? error
        : new Error("external_services_journal_append_failed");
    }
  }

  /** Test helper: seed corrupt JSON for one profile key on disk. */
  async seedCorruptJson(
    profileKey: SettingsAccountKey,
    json: string,
  ): Promise<void> {
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.ensureDirectory(
      resolveExternalServicesJournalDirectoryPath(this.options.storageRoot),
    );
    await this.options.filesystem.writeTextFileAtomic(
      resolveExternalServicesJournalFilePath(this.options.storageRoot, profileKey),
      json,
    );
    this.loadedProfiles.delete(profileKey);
    this.corruptProfiles.delete(profileKey);
  }

  /** Test helper: read persisted JSON for one profile key from disk. */
  async readPersistedJson(
    profileKey: SettingsAccountKey,
  ): Promise<string | undefined> {
    await this.ensureLoaded(profileKey);
    const json = await this.options.filesystem.readTextFile(
      resolveExternalServicesJournalFilePath(this.options.storageRoot, profileKey),
    );
    return json ?? undefined;
  }

  private async ensureLoaded(profileKey: SettingsAccountKey): Promise<void> {
    if (this.loadedProfiles.has(profileKey) || this.corruptProfiles.has(profileKey)) {
      return;
    }
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.ensureDirectory(
      resolveExternalServicesJournalDirectoryPath(this.options.storageRoot),
    );
    const json = await this.options.filesystem.readTextFile(
      resolveExternalServicesJournalFilePath(this.options.storageRoot, profileKey),
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
    const result = parseExternalServicesJournalDocument(parsed, profileKey);
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
      EXTERNAL_SERVICES_JOURNAL_MAX_ENTRIES,
    );
    const serialized = serializeExternalServicesJournalDocument(entries);
    assertPersistedProfileJsonExcludesSecrets(serialized);
    await this.options.filesystem.ensureDirectory(
      resolveProfilesRootPath(this.options.storageRoot),
    );
    await this.options.filesystem.ensureDirectory(
      resolveExternalServicesJournalDirectoryPath(this.options.storageRoot),
    );
    await this.options.filesystem.writeTextFileAtomic(
      resolveExternalServicesJournalFilePath(this.options.storageRoot, profileKey),
      serialized,
    );
  }

  private assertNotCorrupt(profileKey: SettingsAccountKey): void {
    if (!this.corruptProfiles.has(profileKey)) {
      return;
    }
    throw new Error("external_services_journal_document_requires_recovery");
  }

  private markCorrupt(profileKey: SettingsAccountKey, reason: string): void {
    this.corruptProfiles.add(profileKey);
    this.options.logger?.warn("external_services_journal_document_corrupt", {
      featureId: "F-031",
      boundedContext: "Integration",
      operation: "load_external_services_journal",
      result: reason,
    });
  }
}
