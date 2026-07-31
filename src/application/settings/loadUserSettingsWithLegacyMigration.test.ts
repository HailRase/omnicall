import { describe, expect, it, vi } from "vitest";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import {
  createDefaultUserSettings,
  deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity,
  deriveSettingsAccountKeyFromIdentity,
  type UserSettings,
} from "@domain/index.js";
import { loadUserSettingsWithLegacyMigration } from "./loadUserSettingsWithLegacyMigration.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const identity = {
  username: "1001",
  domain: "pbx.example",
  server: "sip:pbx.example",
} as const;

const compositeKey = deriveSettingsAccountKeyFromIdentity(identity);
const legacyKey = deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity(identity);

describe("loadUserSettingsWithLegacyMigration", () => {
  it("copies legacy username-only bucket to composite key on first read", async () => {
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 11,
    };
    const repository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([[legacyKey, legacySettings]]),
    });

    const loaded = await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger: createTestLogger(),
    });

    expect(loaded).toEqual(legacySettings);
    expect(await repository.getUserSettings(compositeKey)).toEqual(legacySettings);
    expect((await repository.listKnownProfileKeys()).includes(compositeKey)).toBe(true);
  });

  it("subsequent reads use composite bucket only without re-copying legacy", async () => {
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      multiSessionsEnabled: false,
    };
    const repository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([[legacyKey, legacySettings]]),
    });
    const logger = createTestLogger();
    const infoSpy = vi.spyOn(logger, "info");

    await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger,
    });

    await repository.saveUserSettings(compositeKey, {
      ...legacySettings,
      language: "ru",
      theme: "light",
    });

    const secondRead = await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger,
    });

    expect(secondRead.language).toBe("ru");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("preserves A→B→A restore after migration", async () => {
    const legacyA: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
    };
    const identityB = {
      username: "1002",
      domain: "pbx.example",
      server: "sip:pbx.example",
    };
    const keyB = deriveSettingsAccountKeyFromIdentity(identityB);
    const repository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([
        [legacyKey, legacyA],
        [keyB, { ...createDefaultUserSettings(), language: "ru", multiSessionsEnabled: true }],
      ]),
    });

    await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger: createTestLogger(),
    });
    await repository.saveUserSettings(compositeKey, {
      ...legacyA,
      autoAnswerTimeoutSec: 7,
    });

    await repository.setActiveProfileKey(keyB);
    await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: keyB,
      identity: identityB,
      logger: createTestLogger(),
    });

    await repository.setActiveProfileKey(compositeKey);
    const restoredA = await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger: createTestLogger(),
    });

    expect(restoredA).toMatchObject({
      language: "en",
      theme: "dark",
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 7,
    });
  });

  it("does not destroy composite bucket when legacy file is corrupt", async () => {
    const root = await mkdtemp(join(tmpdir(), "omnicall-migrate-corrupt-"));
    const filesystem = new NodeFileSystemAdapter();
    const compositeSettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
      theme: "dark",
    };

    try {
      const seeded = new FileSettingsRepository({ storageRoot: root, filesystem });
      await seeded.saveUserSettings(compositeKey, compositeSettings);
      await seeded.seedCorruptJson("1001", "{not-json");

      const repository = new FileSettingsRepository({ storageRoot: root, filesystem });
      const loaded = await loadUserSettingsWithLegacyMigration({
        settingsRepository: repository,
        compositeAccountKey: compositeKey,
        identity,
        logger: createTestLogger(),
      });

      expect(loaded).toEqual(compositeSettings);
      expect(await repository.readPersistedJson(compositeKey)).toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns defaults when legacy is corrupt and composite bucket is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "omnicall-migrate-legacy-corrupt-"));
    const filesystem = new NodeFileSystemAdapter();

    try {
      const seeded = new FileSettingsRepository({ storageRoot: root, filesystem });
      await seeded.seedCorruptJson("1001", "{not-json");

      const repository = new FileSettingsRepository({ storageRoot: root, filesystem });
      const loaded = await loadUserSettingsWithLegacyMigration({
        settingsRepository: repository,
        compositeAccountKey: compositeKey,
        identity,
        logger: createTestLogger(),
      });

      expect(loaded).toEqual(createDefaultUserSettings());
      expect(await repository.readPersistedJson(compositeKey)).toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("migrates username-only active profile key to composite key", async () => {
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: legacyKey,
      userSettingsByAccount: new Map([[legacyKey, legacySettings]]),
    });

    await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger: createTestLogger(),
    });

    expect(await repository.getActiveProfileKey()).toBe(compositeKey);
  });

  it("logs migration event without secrets", async () => {
    const legacySettings: UserSettings = {
      ...createDefaultUserSettings(),
      language: "en",
    };
    const repository = new InMemorySettingsRepository({
      userSettingsByAccount: new Map([[legacyKey, legacySettings]]),
    });
    const logger = createTestLogger();
    const infoSpy = vi.spyOn(logger, "info");

    await loadUserSettingsWithLegacyMigration({
      settingsRepository: repository,
      compositeAccountKey: compositeKey,
      identity,
      logger,
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "settings_profile_key_migrated",
      expect.objectContaining({
        featureId: "F-023",
        sourceKey: legacyKey,
        targetKey: compositeKey,
        result: "succeeded",
      }),
    );
    const logPayload = JSON.stringify(infoSpy.mock.calls[0]?.[1] ?? {});
    expect(logPayload.toLowerCase()).not.toContain("password");
  });
});
