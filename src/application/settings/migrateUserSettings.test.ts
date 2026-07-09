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

  it("migrates v0 legacy fragments to v4", () => {
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
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.multiSessionsEnabled).toBe(false);
      expect(result.value.headsetEnabled).toBe(false);
    }
  });

  it("passes through valid v4 payload", () => {
    const v4 = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
    };
    const result = migrateUserSettings(v4);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(v4);
    }
  });

  it("migrates v3 payload to v4 with headset defaults", () => {
    const v3 = {
      ...createDefaultUserSettings(),
      schemaVersion: 3 as const,
      headsetEnabled: undefined,
      headsetAutoReconnect: undefined,
    };
    delete (v3 as { headsetEnabled?: unknown }).headsetEnabled;
    delete (v3 as { headsetAutoReconnect?: unknown }).headsetAutoReconnect;
    const result = migrateUserSettings(v3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.headsetEnabled).toBe(false);
      expect(result.value.headsetAutoReconnect).toBe(true);
    }
  });

  it("migrates v2 payload to v4 with default codec preferences", () => {
    const v2 = {
      ...createDefaultUserSettings(),
      schemaVersion: 2 as const,
      multiSessionsEnabled: false,
    };
    delete (v2 as { codecPreferences?: unknown }).codecPreferences;

    const result = migrateUserSettings(v2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.codecPreferences).toEqual(createDefaultUserSettings().codecPreferences);
    }
  });

  it("migrates v1 payload to v4 with transport and codec defaults", () => {
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
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.theme).toBe("dark");
      expect(result.value.headsetEnabled).toBe(false);
    }
  });

  it("fails on unsupported schema version", () => {
    const result = migrateUserSettings({ schemaVersion: 99 });
    expect(result.ok).toBe(false);
  });

  it("fails on corrupt v4 payload", () => {
    const result = migrateUserSettings({
      ...createDefaultUserSettings(),
      multiSessionsEnabled: "yes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
  });
});
