import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createDefaultUserSettings,
  SETTINGS_SCHEMA_VERSION,
  createSettingsAccountKey,
  createSipAccountId,
  type UserSettings,
} from "@domain/index.js";
import { createSipAccount } from "@domain/telephony/SipAccount.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { FileSettingsRepository } from "./FileSettingsRepository.js";
import {
  resolveProfileSettingsDirectoryPath,
  resolveProfilesIndexPath,
} from "./profileStoragePaths.js";
import type { InMemorySettingsState } from "./InMemorySettingsRepository.js";

type TestRepositoryContext = Readonly<{
  repository: FileSettingsRepository;
  root: string;
  filesystem: NodeFileSystemAdapter;
}>;

const tempRoots: string[] = [];

async function createTestRepository(
  initial?: Partial<InMemorySettingsState>,
): Promise<TestRepositoryContext> {
  const root = await mkdtemp(join(tmpdir(), "omnicall-settings-"));
  tempRoots.push(root);
  const filesystem = new NodeFileSystemAdapter();
  const repository =
    initial === undefined
      ? new FileSettingsRepository({ storageRoot: root, filesystem })
      : new FileSettingsRepository({ storageRoot: root, filesystem, initial });
  return { repository, root, filesystem };
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

async function readAllPersistedProfileTexts(root: string): Promise<string[]> {
  const settingsDir = resolveProfileSettingsDirectoryPath(root);
  const texts: string[] = [];

  const indexPath = resolveProfilesIndexPath(root);
  try {
    texts.push(await readFile(indexPath, "utf8"));
  } catch {
    // index may be absent
  }

  let settingsFiles: string[] = [];
  try {
    settingsFiles = await readdir(settingsDir);
  } catch {
    return texts;
  }

  for (const fileName of settingsFiles) {
    if (!fileName.endsWith(".json")) {
      continue;
    }
    texts.push(await readFile(join(settingsDir, fileName), "utf8"));
  }

  return texts;
}

describe("FileSettingsRepository", () => {
  it("round-trips user settings through on-disk JSON persistence", async () => {
    const { repository } = await createTestRepository();
    const accountKey = createSettingsAccountKey("agent-1@pbx.example");
    const settings = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 10,
    };

    await repository.saveUserSettings(accountKey, settings);
    expect(await repository.readPersistedJson(accountKey)).toBeDefined();
    expect(await repository.getUserSettings(accountKey)).toEqual(settings);
  });

  it("persists settings across new repository instances", async () => {
    const { repository: firstRepository, root } = await createTestRepository();
    const accountKey = createSettingsAccountKey("1001@tenant.example");
    const settings = {
      ...createDefaultUserSettings(),
      language: "en" as const,
      multiSessionsEnabled: false,
    };

    await firstRepository.saveUserSettings(accountKey, settings);

    const secondRepository = new FileSettingsRepository({
      storageRoot: root,
      filesystem: new NodeFileSystemAdapter(),
    });

    expect(await secondRepository.getUserSettings(accountKey)).toEqual(settings);
  });

  it("isolates profile settings files on disk", async () => {
    const { repository, root } = await createTestRepository();
    const keyA = createSettingsAccountKey("1001@tenant.example");
    const keyB = createSettingsAccountKey("1002@tenant.example");

    await repository.saveUserSettings(keyA, {
      ...createDefaultUserSettings(),
      language: "en",
    });
    await repository.saveUserSettings(keyB, {
      ...createDefaultUserSettings(),
      language: "ru",
    });

    const reloaded = new FileSettingsRepository({
      storageRoot: root,
      filesystem: new NodeFileSystemAdapter(),
    });

    expect((await reloaded.getUserSettings(keyA)).language).toBe("en");
    expect((await reloaded.getUserSettings(keyB)).language).toBe("ru");
  });

  it("migrates v1 payload to v3 with default language", async () => {
    const { repository } = await createTestRepository();
    const accountKey = createSettingsAccountKey("agent-v1@pbx.example");
    await repository.seedCorruptJson(
      "agent-v1@pbx.example",
      JSON.stringify({
        schemaVersion: 1,
        theme: "light",
        multiSessionsEnabled: true,
        autoUnholdOnTransferFailure: true,
        autoAnswerTimeoutSec: null,
        autoAnswerDuringActiveSessionEnabled: false,
        ringbackToneEnabled: true,
        sipAutoReregisterEnabled: true,
        sipReregisterIntervalSec: 5,
        sipReregisterMaxAttempts: 3,
      }),
    );

    const migrated = await repository.getUserSettings(accountKey);
    expect(migrated.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(migrated.language).toBe("ru");
  });

  it("delegates multi-call updates through schema aggregate", async () => {
    const { repository } = await createTestRepository();
    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });

  it("persists active profile key in index.json", async () => {
    const { repository, root } = await createTestRepository();
    const keyA = createSettingsAccountKey("1001@tenant.example");
    const keyB = createSettingsAccountKey("1002@tenant.example");

    await repository.saveUserSettings(keyA, createDefaultUserSettings());
    await repository.saveUserSettings(keyB, createDefaultUserSettings());
    await repository.setActiveProfileKey(keyB);

    const indexJson = await readFile(resolveProfilesIndexPath(root), "utf8");
    expect(indexJson).toContain('"activeProfileKey":"1002@tenant.example"');

    const reloaded = new FileSettingsRepository({
      storageRoot: root,
      filesystem: new NodeFileSystemAdapter(),
    });
    expect(await reloaded.getActiveProfileKey()).toBe(keyB);
  });

  it("delegates active profile methods to in-memory layer with disk listing", async () => {
    const { repository } = await createTestRepository();
    const keyA = createSettingsAccountKey("1001@tenant.example");
    const keyB = createSettingsAccountKey("1002@tenant.example");

    await repository.saveUserSettings(keyA, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
    });
    await repository.saveUserSettings(keyB, {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: true,
    });
    await repository.setActiveProfileKey(keyB);

    expect(await repository.getActiveProfileKey()).toBe(keyB);
    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
    });
    expect(await repository.listKnownProfileKeys()).toEqual([
      createSettingsAccountKey("__anonymous__"),
      keyA,
      keyB,
    ]);
  });

  it("migrates legacy username-only bucket to composite key on application load", async () => {
    const { repository, root } = await createTestRepository();
    const identity = {
      username: "1001",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const compositeKey = createSettingsAccountKey("1001@pbx.example");
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
    };

    await repository.saveUserSettings(createSettingsAccountKey("1001"), legacySettings);

    const { loadUserSettingsWithLegacyMigration } = await import(
      "@application/settings/loadUserSettingsWithLegacyMigration.js"
    );
    const loaded = await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger: createTestLogger(),
    });

    expect(loaded).toEqual(legacySettings);
    expect(await repository.readPersistedJson(compositeKey)).toBeDefined();

    const reloaded = new FileSettingsRepository({
      storageRoot: root,
      filesystem: new NodeFileSystemAdapter(),
    });
    expect(await reloaded.getUserSettings(compositeKey)).toEqual(legacySettings);
  });

  it("fails gracefully on corrupt persisted JSON", async () => {
    const { repository } = await createTestRepository();
    const accountKey = createSettingsAccountKey("agent-corrupt@pbx.example");
    await repository.seedCorruptJson("agent-corrupt@pbx.example", "{not-json");

    await expect(repository.getUserSettings(accountKey)).rejects.toThrow(
      "settings_corrupt:invalid_json",
    );
  });

  it("fails gracefully on unsupported schema version in JSON", async () => {
    const { repository } = await createTestRepository();
    const accountKey = createSettingsAccountKey("agent-v99@pbx.example");
    await repository.seedCorruptJson(
      "agent-v99@pbx.example",
      JSON.stringify({ schemaVersion: 99, multiSessionsEnabled: true }),
    );

    await expect(repository.getUserSettings(accountKey)).rejects.toThrow(
      "settings_corrupt:unsupported_schema_version",
    );
  });

  it("does not persist SIP passwords when saving account session state", async () => {
    const { repository, root } = await createTestRepository();
    const account = createSipAccount(createSipAccountId("1001"), {
      username: "1001",
      password: "super-secret-password",
      domain: "pbx.example",
      server: "wss://pbx.example/ws",
    });

    await repository.saveSipAccount(account);
    await repository.saveUserSettings(createSettingsAccountKey("1001@pbx.example"), {
      ...createDefaultUserSettings(),
      language: "en",
    });
    await repository.setActiveProfileKey(createSettingsAccountKey("1001@pbx.example"));

    const persistedTexts = await readAllPersistedProfileTexts(root);
    expect(persistedTexts.length).toBeGreaterThan(0);
    for (const text of persistedTexts) {
      expect(text.toLowerCase()).not.toContain("super-secret-password");
      expect(text.toLowerCase()).not.toContain('"password"');
    }
  });
});
