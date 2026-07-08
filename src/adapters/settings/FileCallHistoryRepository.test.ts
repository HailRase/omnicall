import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
  createCallHistoryEntryFromSession,
  createCallHistoryEntryId,
  createCallId,
  createSettingsAccountKey,
  MAX_CALL_HISTORY_ENTRIES,
} from "@domain/index.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { FileCallHistoryRepository } from "./FileCallHistoryRepository.js";
import { resolveProfileCallHistoryFilePath } from "./profileStoragePaths.js";

const tempRoots: string[] = [];

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
  repository: FileCallHistoryRepository;
  root: string;
  filesystem: NodeFileSystemAdapter;
}> {
  const root = await mkdtemp(join(tmpdir(), "axatalk-call-history-"));
  tempRoots.push(root);
  const filesystem = new NodeFileSystemAdapter();
  const repository = new FileCallHistoryRepository({
    storageRoot: root,
    filesystem,
    resolveAccountKey,
    logger: createTestLogger(),
  });
  return { repository, root, filesystem };
}

function createSampleEntry(index: number) {
  const created = createCallHistoryEntryFromSession({
    callId: createCallId(`call-${index}`),
    direction: "outgoing",
    remoteNumber: `+1202555${String(index).padStart(4, "0")}`,
    displayLabel: null,
    startedAt: "2026-07-07T10:00:00.000Z",
    endedAt: "2026-07-07T10:01:00.000Z",
    wasAnswered: true,
    failed: false,
    missedBeforeAnswer: false,
  });
  if (!created.ok) {
    throw new Error("expected valid entry");
  }
  return created.value;
}

describe("FileCallHistoryRepository", () => {
  it("returns empty list when history file is absent", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));
    expect(await repository.listEntries()).toEqual([]);
  });

  it("persists history across new repository instances", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository: first, root, filesystem } = await createTestRepository(() => Promise.resolve(key));
    const entry = createSampleEntry(1);

    await first.appendEntry(entry);
    const json = await readFile(resolveProfileCallHistoryFilePath(root, key), "utf8");
    expect(json).toContain("call-1");
    expect(json).not.toContain("password");

    const second = new FileCallHistoryRepository({
      storageRoot: root,
      filesystem,
      resolveAccountKey: () => Promise.resolve(key),
      logger: createTestLogger(),
    });

    const entries = await second.listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(entry.id);
  });

  it("isolates history between profile keys", async () => {
    const keyA = createSettingsAccountKey("1001@pbx.example");
    const keyB = createSettingsAccountKey("1002@pbx.example");
    let activeKey = keyA;

    const { repository } = await createTestRepository(() => Promise.resolve(activeKey));

    await repository.appendEntry(createSampleEntry(1));
    activeKey = keyB;
    expect(await repository.listEntries()).toHaveLength(0);

    await repository.appendEntry(createSampleEntry(2));
    activeKey = keyA;
    const entriesA = await repository.listEntries();
    expect(entriesA).toHaveLength(1);
    expect(entriesA[0]?.callId).toBe(createCallId("call-1"));
  });

  it("deletes one entry and persists remaining rows", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository, root, filesystem } = await createTestRepository(() => Promise.resolve(key));
    const first = createSampleEntry(1);
    const second = createSampleEntry(2);

    await repository.appendEntry(first);
    await repository.appendEntry(second);
    expect(await repository.listEntries()).toHaveLength(2);

    const deleted = await repository.deleteEntry(first.id);
    expect(deleted).toBe(true);
    expect(await repository.listEntries()).toHaveLength(1);
    expect((await repository.listEntries())[0]?.id).toBe(second.id);

    const reloaded = new FileCallHistoryRepository({
      storageRoot: root,
      filesystem,
      resolveAccountKey: () => Promise.resolve(key),
      logger: createTestLogger(),
    });
    const entries = await reloaded.listEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(second.id);
  });

  it("returns false when deleting missing entry", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));
    const entryId = createCallHistoryEntryId("history-missing");
    if (entryId === null) {
      throw new Error("expected valid entry id");
    }

    const deleted = await repository.deleteEntry(entryId);
    expect(deleted).toBe(false);
  });

  it("enforces retention limit on persist and reload", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository, root, filesystem } = await createTestRepository(() => Promise.resolve(key));

    for (let index = 0; index < MAX_CALL_HISTORY_ENTRIES + 5; index += 1) {
      await repository.appendEntry(createSampleEntry(index));
    }

    const reloaded = new FileCallHistoryRepository({
      storageRoot: root,
      filesystem,
      resolveAccountKey: () => Promise.resolve(key),
      logger: createTestLogger(),
    });

    const entries = await reloaded.listEntries();
    expect(entries).toHaveLength(MAX_CALL_HISTORY_ENTRIES);
    expect(entries[0]?.callId).toBe(createCallId(`call-${MAX_CALL_HISTORY_ENTRIES + 4}`));
  });

  it("recovers from corrupt JSON with empty history", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));

    await repository.seedCorruptJson(key, "{broken");
    expect(await repository.listEntries()).toEqual([]);
  });

  it("recovers from corrupt JSON with forbidden secret fields on load", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository } = await createTestRepository(() => Promise.resolve(key));

    await repository.seedCorruptJson(
      key,
      JSON.stringify({
        schemaVersion: CALL_HISTORY_DOCUMENT_SCHEMA_VERSION,
        entries: [],
        token: "abc",
      }),
    );

    expect(await repository.listEntries()).toEqual([]);
  });

  it("does not persist secret-like field names in written JSON", async () => {
    const key = createSettingsAccountKey("1001@pbx.example");
    const { repository, root } = await createTestRepository(() => Promise.resolve(key));

    await repository.appendEntry(createSampleEntry(1));
    const json = await readFile(resolveProfileCallHistoryFilePath(root, key), "utf8");
    expect(json.toLowerCase()).not.toContain('"password"');
    expect(json.toLowerCase()).not.toContain('"token"');
  });
});
