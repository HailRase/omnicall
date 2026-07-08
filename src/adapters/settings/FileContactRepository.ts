import type { Contact } from "@domain/index.js";
import {
  parsePersistedContactsDocument,
  serializeContactsDocument,
  type SettingsAccountKey,
} from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { ContactRepository } from "@ports/settings/ContactRepository.js";
import { assertPersistedProfileJsonExcludesSecrets } from "./assertPersistedProfileJsonExcludesSecrets.js";
import { InMemoryContactRepository } from "./InMemoryContactRepository.js";
import {
  resolveProfileContactsDirectoryPath,
  resolveProfileContactsFilePath,
  resolveProfilesRootPath,
} from "./profileStoragePaths.js";

export type ResolveSettingsAccountKey = () => Promise<SettingsAccountKey>;

export type FileContactRepositoryOptions = Readonly<{
  storageRoot: string;
  filesystem: FileSystemPort;
  resolveAccountKey: ResolveSettingsAccountKey;
  logger?: Logger;
}>;

/**
 * - Purpose: persist local contacts per SettingsAccountKey on disk.
 * - Inputs: storage root, filesystem port, active account key resolver.
 * - Outputs: ContactRepository with validated JSON boundary and atomic writes.
 */
export class FileContactRepository implements ContactRepository {
  private readonly storageRoot: string;
  private readonly filesystem: FileSystemPort;
  private readonly resolveAccountKey: ResolveSettingsAccountKey;
  private readonly logger: Logger | undefined;
  private readonly accountMemory = new Map<SettingsAccountKey, InMemoryContactRepository>();
  private readonly loadedAccounts = new Set<SettingsAccountKey>();

  constructor(options: FileContactRepositoryOptions) {
    this.storageRoot = options.storageRoot;
    this.filesystem = options.filesystem;
    this.resolveAccountKey = options.resolveAccountKey;
    this.logger = options.logger;
  }

  async listContacts(): Promise<ReadonlyArray<Contact>> {
    const memory = await this.getActiveAccountMemory();
    return memory.listContacts();
  }

  async getContactById(
    contactId: Parameters<ContactRepository["getContactById"]>[0],
  ): Promise<Contact | null> {
    const memory = await this.getActiveAccountMemory();
    return memory.getContactById(contactId);
  }

  async createContact(
    input: Parameters<ContactRepository["createContact"]>[0],
  ): Promise<Contact> {
    const accountKey = await this.resolveAccountKey();
    const memory = await this.getAccountMemory(accountKey);
    const created = await memory.createContact(input);
    await this.persistAccountContacts(accountKey, memory);
    return created;
  }

  async updateContact(
    contactId: Parameters<ContactRepository["updateContact"]>[0],
    input: Parameters<ContactRepository["updateContact"]>[1],
  ): Promise<Contact | null> {
    const accountKey = await this.resolveAccountKey();
    const memory = await this.getAccountMemory(accountKey);
    const updated = await memory.updateContact(contactId, input);
    if (updated !== null) {
      await this.persistAccountContacts(accountKey, memory);
    }
    return updated;
  }

  async deleteContact(
    contactId: Parameters<ContactRepository["deleteContact"]>[0],
  ): Promise<boolean> {
    const accountKey = await this.resolveAccountKey();
    const memory = await this.getAccountMemory(accountKey);
    const deleted = await memory.deleteContact(contactId);
    if (deleted) {
      await this.persistAccountContacts(accountKey, memory);
    }
    return deleted;
  }

  /** Test helper: seed corrupt JSON for one account key on disk. */
  async seedCorruptJson(accountKey: SettingsAccountKey, json: string): Promise<void> {
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileContactsDirectoryPath(this.storageRoot),
    );
    await this.filesystem.writeTextFileAtomic(
      resolveProfileContactsFilePath(this.storageRoot, accountKey),
      json,
    );
    this.loadedAccounts.delete(accountKey);
    this.accountMemory.delete(accountKey);
  }

  /** Test helper: read persisted JSON for one account key from disk. */
  async readPersistedJson(accountKey: SettingsAccountKey): Promise<string | undefined> {
    await this.getAccountMemory(accountKey);
    const json = await this.filesystem.readTextFile(
      resolveProfileContactsFilePath(this.storageRoot, accountKey),
    );
    return json ?? undefined;
  }

  private async getActiveAccountMemory(): Promise<InMemoryContactRepository> {
    const accountKey = await this.resolveAccountKey();
    return this.getAccountMemory(accountKey);
  }

  private async getAccountMemory(
    accountKey: SettingsAccountKey,
  ): Promise<InMemoryContactRepository> {
    if (!this.loadedAccounts.has(accountKey)) {
      await this.loadAccountContacts(accountKey);
    }

    let memory = this.accountMemory.get(accountKey);
    if (memory === undefined) {
      memory = new InMemoryContactRepository();
      this.accountMemory.set(accountKey, memory);
    }

    return memory;
  }

  private async loadAccountContacts(accountKey: SettingsAccountKey): Promise<void> {
    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileContactsDirectoryPath(this.storageRoot),
    );

    const memory = new InMemoryContactRepository();
    const json = await this.filesystem.readTextFile(
      resolveProfileContactsFilePath(this.storageRoot, accountKey),
    );

    if (json !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json) as unknown;
      } catch {
        this.logCorruptDocument(accountKey, "invalid_json");
      }

      if (parsed !== undefined) {
        const documentResult = parsePersistedContactsDocument(parsed);
        if (!documentResult.ok) {
          this.logCorruptDocument(accountKey, documentResult.error.code);
        } else {
          memory.replaceContacts(documentResult.value.contacts);
        }
      }
    }

    this.accountMemory.set(accountKey, memory);
    this.loadedAccounts.add(accountKey);
  }

  private async persistAccountContacts(
    accountKey: SettingsAccountKey,
    memory: InMemoryContactRepository,
  ): Promise<void> {
    const contacts = await memory.listContacts();
    const serialized = serializeContactsDocument(contacts);
    assertPersistedProfileJsonExcludesSecrets(serialized);

    await this.filesystem.ensureDirectory(resolveProfilesRootPath(this.storageRoot));
    await this.filesystem.ensureDirectory(
      resolveProfileContactsDirectoryPath(this.storageRoot),
    );
    await this.filesystem.writeTextFileAtomic(
      resolveProfileContactsFilePath(this.storageRoot, accountKey),
      serialized,
    );
  }

  private logCorruptDocument(accountKey: SettingsAccountKey, reason: string): void {
    this.logger?.warn("contacts_document_corrupt", {
      featureId: "F-025",
      boundedContext: "Settings",
      operation: "load_contacts",
      accountKey,
      result: reason,
    });
  }
}
