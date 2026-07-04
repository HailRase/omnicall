import { describe, expect, it } from "vitest";
import { createDefaultUserSettings, createSettingsAccountKey } from "@domain/index.js";
import { FileSettingsRepository } from "./FileSettingsRepository.js";

describe("FileSettingsRepository", () => {
  it("round-trips user settings through JSON persistence", async () => {
    const repository = new FileSettingsRepository();
    const accountKey = createSettingsAccountKey("agent-1");
    const settings = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      autoAnswerTimeoutSec: 10,
    };

    await repository.saveUserSettings(accountKey, settings);
    expect(repository.readPersistedJson(accountKey)).toBeDefined();
    expect(await repository.getUserSettings(accountKey)).toEqual(settings);
  });

  it("migrates v1 payload to v2 with default language", async () => {
    const repository = new FileSettingsRepository();
    const accountKey = createSettingsAccountKey("agent-v1");
    repository.seedCorruptJson(
      "agent-v1",
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
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.language).toBe("ru");
  });

  it("delegates multi-call updates through schema aggregate", async () => {
    const repository = new FileSettingsRepository();
    await repository.setMultiCallSettings({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
    expect(await repository.getMultiCallSettings()).toEqual({
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
    });
  });

  it("fails gracefully on corrupt persisted JSON", async () => {
    const repository = new FileSettingsRepository();
    const accountKey = createSettingsAccountKey("agent-corrupt");
    repository.seedCorruptJson("agent-corrupt", "{not-json");

    await expect(repository.getUserSettings(accountKey)).rejects.toThrow(
      "settings_corrupt:invalid_json",
    );
  });

  it("fails gracefully on unsupported schema version in JSON", async () => {
    const repository = new FileSettingsRepository();
    const accountKey = createSettingsAccountKey("agent-v99");
    repository.seedCorruptJson(
      "agent-v99",
      JSON.stringify({ schemaVersion: 99, multiSessionsEnabled: true }),
    );

    await expect(repository.getUserSettings(accountKey)).rejects.toThrow(
      "settings_corrupt:unsupported_schema_version",
    );
  });
});
