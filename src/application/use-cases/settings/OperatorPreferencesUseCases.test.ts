import { describe, expect, it } from "vitest";
import {
  createDefaultUserNotificationPreferences,
  createDefaultUserSettings,
  createSettingsAccountKey,
  parseExternalServicesSettings,
  PREFERENCES_EXPORT_FORMAT_ID,
  PREFERENCES_EXPORT_FORMAT_VERSION,
  SETTINGS_SCHEMA_VERSION,
  type UserNotificationPreferences,
} from "@domain/index.js";
import { InMemorySettingsRepository } from "@adapters/settings/InMemorySettingsRepository.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { ExportOperatorPreferencesUseCase } from "./ExportOperatorPreferencesUseCase.js";
import { ImportOperatorPreferencesUseCase } from "./ImportOperatorPreferencesUseCase.js";

function createCustomNotificationPreferences(): UserNotificationPreferences {
  const defaults = createDefaultUserNotificationPreferences();
  return {
    masterInAppPopupEnabled: false,
    appearance: {
      placement: "bottom-left",
      stacking: "single",
      durationMs: 8000,
      closable: false,
      maxVisible: 2,
    },
    modules: {
      ...defaults.modules,
      telephony: { enabled: false, minLevel: "info", raiseWindow: "never" },
      sdk: { enabled: true, minLevel: "warning", raiseWindow: "never" },
      updates: { enabled: true, minLevel: "error", raiseWindow: "never" },
    },
  };
}

const EXTERNAL_SERVICES_FIXTURE = (() => {
  const parsed = parseExternalServicesSettings({
    collections: [
      {
        id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "CRM",
        enabled: false,
        variables: [{ key: "tenant", value: "acme" }],
        requests: [
          {
            id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
            name: "Notify",
            enabled: true,
            method: "PUT",
            url: "https://hooks.example.test/{{tenant}}",
            query: [],
            headers: [
              {
                id: "c0b1c2d3-e4f5-4a67-8b90-123456789012",
                key: "X-Api-Key",
                value: "authored-key",
                enabled: true,
              },
            ],
            body: { mode: "raw", value: "ping" },
            triggers: [{ eventType: "call_ended", delaySeconds: 0 }],
          },
        ],
      },
    ],
  });
  if (!parsed.ok) {
    throw new Error("Failed to build External Services preferences fixture.");
  }
  return parsed.value;
})();

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

  it("round-trips Notification Center preferences into the active target profile", async () => {
    const sourceKey = createSettingsAccountKey("alice@example.com");
    const targetKey = createSettingsAccountKey("bob@example.com");
    const notificationPreferences = createCustomNotificationPreferences();
    const repository = new InMemorySettingsRepository({
      activeProfileKey: sourceKey,
      userSettingsByAccount: new Map([
        [
          sourceKey,
          {
            ...createDefaultUserSettings(),
            notificationPreferences,
          },
        ],
        [targetKey, createDefaultUserSettings()],
      ]),
    });
    const logger = createTestLogger();
    const exportUseCase = new ExportOperatorPreferencesUseCase(repository, logger);
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const exported = await exportUseCase.execute({ appVersion: "1.2.0" });
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    expect(exported.value.settings.notificationPreferences).toEqual(notificationPreferences);
    expect(exported.value.jsonContents).toContain("notificationPreferences");
    expect(exported.value.jsonContents).not.toContain("user-notification-journal");
    expect(exported.value.jsonContents).not.toContain("suppressedAtEmission");

    await repository.setActiveProfileKey(targetKey);
    const imported = await importUseCase.execute({
      jsonContents: exported.value.jsonContents,
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }

    const savedTarget = await repository.getUserSettings(targetKey);
    const savedSource = await repository.getUserSettings(sourceKey);
    expect(savedTarget.notificationPreferences).toEqual(notificationPreferences);
    expect(imported.value.settings.notificationPreferences).toEqual(notificationPreferences);
    expect(savedSource.notificationPreferences).toEqual(notificationPreferences);
  });

  it("rejects malformed notification preferences without mutating active settings", async () => {
    const accountKey = createSettingsAccountKey("alice@example.com");
    const originalPreferences = createCustomNotificationPreferences();
    const original = {
      ...createDefaultUserSettings(),
      theme: "dark" as const,
      notificationPreferences: originalPreferences,
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: accountKey,
      userSettingsByAccount: new Map([[accountKey, original]]),
    });
    const logger = createTestLogger();
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const imported = await importUseCase.execute({
      jsonContents: JSON.stringify({
        format: PREFERENCES_EXPORT_FORMAT_ID,
        formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
        exportedAt: "2026-08-02T15:00:00.000Z",
        settings: {
          ...createDefaultUserSettings(),
          notificationPreferences: {
            ...createDefaultUserNotificationPreferences(),
            masterInAppPopupEnabled: "bad",
          },
        },
      }),
    });
    expect(imported.ok).toBe(false);

    const saved = await repository.getUserSettings(accountKey);
    expect(saved.theme).toBe("dark");
    expect(saved.notificationPreferences).toEqual(originalPreferences);
  });

  it("round-trips External Services definitions into the active target profile", async () => {
    const sourceKey = createSettingsAccountKey("alice@example.com");
    const targetKey = createSettingsAccountKey("bob@example.com");
    const repository = new InMemorySettingsRepository({
      activeProfileKey: sourceKey,
      userSettingsByAccount: new Map([
        [
          sourceKey,
          {
            ...createDefaultUserSettings(),
            externalServices: EXTERNAL_SERVICES_FIXTURE,
          },
        ],
        [targetKey, createDefaultUserSettings()],
      ]),
    });
    const logger = createTestLogger();
    const exportUseCase = new ExportOperatorPreferencesUseCase(repository, logger);
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const exported = await exportUseCase.execute({ appVersion: "0.13.0" });
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }
    expect(exported.value.settings.externalServices).toEqual(EXTERNAL_SERVICES_FIXTURE);
    expect(exported.value.jsonContents).toContain("authored-key");
    expect(exported.value.jsonContents).not.toContain("\"journal\"");
    expect(exported.value.jsonContents.toLowerCase()).not.toContain("\"password\"");
    expect(exported.value.jsonContents.toLowerCase()).not.toContain("sdkpairing");

    await repository.setActiveProfileKey(targetKey);
    const imported = await importUseCase.execute({
      jsonContents: exported.value.jsonContents,
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }

    const savedTarget = await repository.getUserSettings(targetKey);
    const savedSource = await repository.getUserSettings(sourceKey);
    expect(savedTarget.externalServices).toEqual(EXTERNAL_SERVICES_FIXTURE);
    expect(savedSource.externalServices).toEqual(EXTERNAL_SERVICES_FIXTURE);
  });

  it("rejects invalid import documents without mutating settings", async () => {
    const accountKey = createSettingsAccountKey("alice@example.com");
    const original = {
      ...createDefaultUserSettings(),
      theme: "light" as const,
      externalServices: EXTERNAL_SERVICES_FIXTURE,
    };
    const repository = new InMemorySettingsRepository({
      activeProfileKey: accountKey,
      userSettingsByAccount: new Map([[accountKey, original]]),
    });
    const logger = createTestLogger();
    const importUseCase = new ImportOperatorPreferencesUseCase(repository, logger);

    const imported = await importUseCase.execute({
      jsonContents: JSON.stringify({ format: "not-omnicall" }),
    });
    expect(imported.ok).toBe(false);

    const saved = await repository.getUserSettings(accountKey);
    expect(saved.theme).toBe("light");
    expect(saved.externalServices).toEqual(EXTERNAL_SERVICES_FIXTURE);
  });
});
