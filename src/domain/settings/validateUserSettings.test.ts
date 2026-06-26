import { describe, expect, it } from "vitest";
import { createDefaultUserSettings } from "./UserSettings.js";
import { validateUserSettings } from "./validateUserSettings.js";

describe("validateUserSettings", () => {
  it("accepts default v1 settings", () => {
    const result = validateUserSettings(createDefaultUserSettings());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(createDefaultUserSettings());
    }
  });

  it("rejects non-object payload", () => {
    expect(validateUserSettings(null).ok).toBe(false);
    expect(validateUserSettings("x").ok).toBe(false);
  });

  it("rejects unsupported schema version", () => {
    const result = validateUserSettings({
      schemaVersion: 99,
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
      autoAnswerTimeoutSec: null,
      ringbackToneEnabled: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("unsupported_schema_version");
    }
  });

  it("rejects invalid auto-answer timeout", () => {
    const result = validateUserSettings({
      schemaVersion: 1,
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
      autoAnswerTimeoutSec: -1,
      ringbackToneEnabled: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("autoAnswerTimeoutSec_out_of_range");
    }
  });

  it("rejects missing boolean fields", () => {
    const result = validateUserSettings({
      schemaVersion: 1,
      autoAnswerTimeoutSec: null,
    });
    expect(result.ok).toBe(false);
  });

  it("defaults theme to light when field is missing", () => {
    const result = validateUserSettings({
      schemaVersion: 1,
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
      autoAnswerTimeoutSec: null,
      ringbackToneEnabled: true,
      sipAutoReregisterEnabled: true,
      sipReregisterIntervalSec: 5,
      sipReregisterMaxAttempts: 3,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.theme).toBe("light");
    }
  });

  it("rejects invalid theme", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      theme: "sepia",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("theme_invalid");
    }
  });
});
