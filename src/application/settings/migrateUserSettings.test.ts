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

  it("migrates v0 legacy fragments to v1", () => {
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
      expect(result.value.schemaVersion).toBe(1);
      expect(result.value.multiSessionsEnabled).toBe(false);
      expect(result.value.autoUnholdOnTransferFailure).toBe(false);
      expect(result.value.autoAnswerTimeoutSec).toBe(5);
    }
  });

  it("passes through valid v1 payload", () => {
    const v1 = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
    };
    const result = migrateUserSettings(v1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(v1);
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

  it("fails on corrupt v1 payload", () => {
    const result = migrateUserSettings({
      schemaVersion: 1,
      multiSessionsEnabled: "yes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
  });
});
