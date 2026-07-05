import { describe, expect, it } from "vitest";
import { createDefaultUserSettings } from "@domain/settings/UserSettings.js";
import { migrateUserSettings } from "./migrateUserSettings.js";

describe("migrateUserSettings", () => {
  it("returns defaults for null raw without legacy", () => {
    const result = migrateUserSettings(null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(createDefaultUserSettings());
    }
  });

  it("migrates v0 legacy fragments to v3", () => {
    const result = migrateUserSettings(
      { schemaVersion: 0 },
      {
        multiCallSettings: {
          multiSessionsEnabled: false,
          autoUnholdOnTransferFailure: false,
        },
        autoAnswerTimeoutSec: 5,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(3);
      expect(result.value.multiSessionsEnabled).toBe(false);
      expect(result.value.autoUnholdOnTransferFailure).toBe(false);
      expect(result.value.autoAnswerTimeoutSec).toBe(5);
      expect(result.value.language).toBe("ru");
      expect(result.value.sipAutoReconnectEnabled).toBe(true);
    }
  });

  it("passes through valid v3 payload", () => {
    const v3 = {
      ...createDefaultUserSettings(),
      schemaVersion: 3 as const,
      multiSessionsEnabled: false,
    };
    const result = migrateUserSettings(v3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(v3);
    }
  });

  it("migrates v2 payload to v3 with default codec preferences", () => {
    const v2 = {
      ...createDefaultUserSettings(),
      schemaVersion: 2 as const,
      multiSessionsEnabled: false,
    };
    delete (v2 as { codecPreferences?: unknown }).codecPreferences;

    const result = migrateUserSettings(v2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(3);
      expect(result.value.multiSessionsEnabled).toBe(false);
      expect(result.value.codecPreferences).toEqual(createDefaultUserSettings().codecPreferences);
    }
  });

  it("migrates v1 payload to v3 with transport and codec defaults", () => {
    const v1 = {
      schemaVersion: 1,
      theme: "dark" as const,
      multiSessionsEnabled: false,
      autoUnholdOnTransferFailure: true,
      autoAnswerTimeoutSec: null,
      autoAnswerDuringActiveSessionEnabled: false,
      ringbackToneEnabled: true,
      sipAutoReregisterEnabled: false,
      sipReregisterIntervalSec: 8,
      sipReregisterMaxAttempts: 2,
    };
    const result = migrateUserSettings(v1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(3);
      expect(result.value.language).toBe("ru");
      expect(result.value.theme).toBe("dark");
      expect(result.value.sipAutoReconnectEnabled).toBe(true);
      expect(result.value.sipReconnectIntervalSec).toBe(5);
      expect(result.value.sipAutoReregisterEnabled).toBe(false);
      expect(result.value.sipReregisterIntervalSec).toBe(8);
      expect(result.value.codecPreferences).toEqual(createDefaultUserSettings().codecPreferences);
    }
  });

  it("migrates supported v1 language and falls back for unknown locale", () => {
    const frV1 = {
      ...createDefaultUserSettings(),
      schemaVersion: 1 as const,
      language: "fr" as const,
    };
    const unknownLocaleV1 = {
      ...createDefaultUserSettings(),
      schemaVersion: 1 as const,
      language: "es",
    };

    const frResult = migrateUserSettings(frV1);
    const unknownLocaleResult = migrateUserSettings(unknownLocaleV1);

    expect(frResult.ok).toBe(true);
    if (frResult.ok) {
      expect(frResult.value.language).toBe("fr");
    }

    expect(unknownLocaleResult.ok).toBe(true);
    if (unknownLocaleResult.ok) {
      expect(unknownLocaleResult.value.language).toBe("ru");
    }
  });

  it("fails on unsupported schema version", () => {
    const result = migrateUserSettings({ schemaVersion: 99 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
      expect(result.error.message).toContain("unsupported_schema_version");
    }
  });

  it("fails on corrupt v3 payload", () => {
    const result = migrateUserSettings({
      schemaVersion: 3,
      multiSessionsEnabled: "yes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
  });
});
