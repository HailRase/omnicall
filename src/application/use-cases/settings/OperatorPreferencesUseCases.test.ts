import { describe, expect, it } from "vitest";
import {
  createDefaultUserSettings,
  createSettingsAccountKey,
  PREFERENCES_EXPORT_FORMAT_ID,
  PREFERENCES_EXPORT_FORMAT_VERSION,
  SETTINGS_SCHEMA_VERSION,
} from "@domain/index.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { ExportOperatorPreferencesUseCase } from "./ExportOperatorPreferencesUseCase.js";
import { ImportOperatorPreferencesUseCase } from "./ImportOperatorPreferencesUseCase.js";

describe("OperatorPreferencesUseCases", () => {
  it("exports portable JSON and imports into the active profile", async () => {
    const accountKey = createSettingsAccountKey("alice@example.com");
    const repository = new InMemorySettingsRepository({
      activeProfileKey: accountKey,
      userSettingsByAccount: new Map([
        [
          accountKey,
          {
            ...createDefaultUserSettings(),
            theme: "dark",
            language: "en",
            preferredAudioInputDeviceId: "mic-local",
            ocpIntegration: {
              enabled: true,
              domain: "ocp.example.com",
              autoConnect: false,
              linked: true,
            },
          },
        ],
      ]),
    });
    const logger = createTestLogger();
    const exportUseCase = new ExportOperatorPreferencesUseCase(repository, logger);
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const exported = await exportUseCase.execute({ appVersion: "0.12.0" });
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    expect(exported.value.settings.preferredAudioInputDeviceId).toBeNull();
    expect(exported.value.settings.ocpIntegration.linked).toBe(false);
    expect(exported.value.jsonContents).toContain(PREFERENCES_EXPORT_FORMAT_ID);
    expect(exported.value.jsonContents).toContain(`"formatVersion": ${PREFERENCES_EXPORT_FORMAT_VERSION}`);
    expect(exported.value.jsonContents.toLowerCase()).not.toContain("password");

    const targetKey = createSettingsAccountKey("bob@example.com");
    await repository.setActiveProfileKey(targetKey);
    await repository.saveUserSettings(targetKey, createDefaultUserSettings());

    const imported = await importUseCase.execute({
      jsonContents: exported.value.jsonContents,
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }

    const saved = await repository.getUserSettings(targetKey);
    expect(saved.theme).toBe("dark");
    expect(saved.language).toBe("en");
    expect(saved.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(saved.preferredAudioInputDeviceId).toBeNull();
    expect(saved.ocpIntegration).toEqual({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: false,
      linked: false,
    });
  });

  it("rejects invalid import documents without mutating settings", async () => {
    const accountKey = createSettingsAccountKey("alice@example.com");
    const original = {
      ...createDefaultUserSettings(),
      theme: "light" as const,
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: accountKey,
      userSettingsByAccount: new Map([[accountKey, original]]),
    });
    const logger = createTestLogger();
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const imported = await importUseCase.execute({
      jsonContents: JSON.stringify({ format: "not-axatalk" }),
    });
    expect(imported.ok).toBe(false);

    const saved = await repository.getUserSettings(accountKey);
    expect(saved.theme).toBe("light");
  });
});
