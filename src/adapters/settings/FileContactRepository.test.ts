import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  CONTACTS_DOCUMENT_SCHEMA_VERSION,
  createSettingsAccountKey,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { FileContactRepository } from "./FileContactRepository.js";
import {
  resolveProfileContactsDirectoryPath,
  resolveProfileContactsFilePath,
} from "./profileStoragePaths.js";

const tempRoots: string[] = [];

const sampleInput = {
  displayName: "Alex Agent",
  primaryPhone: "+12025550100",
} as const;

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

async function createTestRepository(
  resolveAccountKey: () => Promise<ReturnType<typeof createSettingsAccountKey>>,
): Promise<{
  repository: FileContactRepository;
  root: string;
  filesystem: NodeFileSystemAdapter;
}> {
  const root = await mkdtemp(join(tmpdir(), "axatalk-contacts-"));
  tempRoots.push(root);
  const filesystem = new NodeFileSystemAdapter();
  const repository = new FileContactRepository({
    storageRoot: root,
    filesystem,
    resolveAccountKey,
    logger: createTestLogger(),
  });
  return { repository, root, filesystem };
}

describe("FileContactRepository", () => {
  it("returns empty list when contacts file is absent", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));
    expect(await repository.listContacts()).toEqual([]);
  });

  it("persists contacts across new repository instances", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository: first, root, filesystem } = await createTestRepository(() => Promise.resolve(key));

    await first.createContact(sampleInput);
    const json = await readFile(resolveProfileContactsFilePath(root, key), "utf8");
    expect(json).toContain("Alex Agent");
    expect(json).not.toContain("password");

    const second = new FileContactRepository({
      storageRoot: root,
      filesystem,
      resolveAccountKey: () => Promise.resolve(key),
      logger: createTestLogger(),
    });

    const contacts = await second.listContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.displayName).toBe("Alex Agent");
  });

  it("isolates contacts between profile keys", async () => {
    const keyA = createSettingsAccountKey("1001@pbx.example");
    const keyB = createSettingsAccountKey("1002@pbx.example");
    let activeKey = keyA;

    const { repository, root } = await createTestRepository(() => {
      return Promise.resolve(activeKey);
    });

    await repository.createContact(sampleInput);
    expect(await repository.listContacts()).toHaveLength(1);

    activeKey = keyB;
    expect(await repository.listContacts()).toHaveLength(0);

    await repository.createContact({
      displayName: "Bob Agent",
      primaryPhone: "+12025550101",
    });

    activeKey = keyA;
    const profileAContacts = await repository.listContacts();
    expect(profileAContacts).toHaveLength(1);
    expect(profileAContacts[0]?.displayName).toBe("Alex Agent");

    const profileBPath = resolveProfileContactsFilePath(root, keyB);
    const profileBJson = await readFile(profileBPath, "utf8");
    expect(profileBJson).toContain("Bob Agent");
    expect(profileBJson).not.toContain("Alex Agent");
  });

  it("recovers from corrupt JSON with empty contacts", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));

    await repository.seedCorruptJson(key, "{not-json");
    expect(await repository.listContacts()).toEqual([]);
  });

  it("recovers from corrupt JSON with forbidden secret fields on load", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));

    await repository.seedCorruptJson(
      key,
      JSON.stringify({
        schemaVersion: CONTACTS_DOCUMENT_SCHEMA_VERSION,
        contacts: [],
        password: "secret",
      }),
    );

    expect(await repository.listContacts()).toEqual([]);
  });

  it("does not persist secret-like field names in written JSON", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository, root } = await createTestRepository(() => Promise.resolve(key));

    await repository.createContact(sampleInput);
    const json = await readFile(resolveProfileContactsFilePath(root, key), "utf8");
    expect(json.toLowerCase()).not.toContain('"password"');
    expect(json.toLowerCase()).not.toContain('"token"');
  });

  it("creates contacts directory under profiles root", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository, root } = await createTestRepository(() => Promise.resolve(key));

    await repository.createContact(sampleInput);
    const contactsDir = resolveProfileContactsDirectoryPath(root);
    expect(contactsDir).toContain("profiles");
    expect(contactsDir).toContain("contacts");
  });
});
