import { describe, expect, it } from "vitest";
import { createDefaultUserSettings } from "./UserSettings.js";
import { validateUserSettings } from "./validateUserSettings.js";

describe("validateUserSettings", () => {
  it("accepts optional headsetPreferredDeviceId", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      headsetPreferredDeviceId: "0b0e:0300:Jabra",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.headsetPreferredDeviceId).toBe("0b0e:0300:Jabra");
    }
  });

  it("accepts default v5 settings", () => {
    const result = validateUserSettings(createDefaultUserSettings());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(createDefaultUserSettings());
    }
  });

  it("defaults headsetPreferredDeviceId to null when missing", () => {
    const payload = { ...createDefaultUserSettings() } as Record<string, unknown>;
    delete payload["headsetPreferredDeviceId"];
    const result = validateUserSettings(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.headsetPreferredDeviceId).toBeNull();
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
      ...createDefaultUserSettings(),
      autoAnswerTimeoutSec: -1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("autoAnswerTimeoutSec_out_of_range");
    }
  });

  it("rejects missing boolean fields", () => {
    const result = validateUserSettings({
      schemaVersion: 6,
      autoAnswerTimeoutSec: null,
    });
    expect(result.ok).toBe(false);
  });

  it("defaults theme to light when field is missing", () => {
    const payload = { ...createDefaultUserSettings() } as Record<string, unknown>;
    delete payload["theme"];
    const result = validateUserSettings(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.theme).toBe("light");
    }
  });

  it("accepts zero-second auto-answer timeout", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      autoAnswerTimeoutSec: 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.autoAnswerTimeoutSec).toBe(0);
    }
  });

  it("defaults autoAnswerDuringActiveSessionEnabled when field is missing", () => {
    const payload = { ...createDefaultUserSettings() } as Record<string, unknown>;
    delete payload["autoAnswerDuringActiveSessionEnabled"];
    const result = validateUserSettings(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.autoAnswerDuringActiveSessionEnabled).toBe(false);
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

  it("rejects invalid language", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      language: "es",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("language_invalid");
    }
  });

  it("accepts new supported locales", () => {
    const frResult = validateUserSettings({
      ...createDefaultUserSettings(),
      language: "fr",
    });
    const deResult = validateUserSettings({
      ...createDefaultUserSettings(),
      language: "de",
    });

    expect(frResult.ok).toBe(true);
    if (frResult.ok) {
      expect(frResult.value.language).toBe("fr");
    }

    expect(deResult.ok).toBe(true);
    if (deResult.ok) {
      expect(deResult.value.language).toBe("de");
    }
  });

  it("accepts dismissed update banner version", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      dismissedUpdateBannerVersion: "0.1.1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.dismissedUpdateBannerVersion).toBe("0.1.1");
    }
  });

  it("accepts notification preference fields", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      notificationPlacement: "top-left",
      notificationStacking: "single",
      notificationDurationMs: 6500,
      notificationClosable: false,
      notificationMaxVisible: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.notificationPlacement).toBe("top-left");
      expect(result.value.notificationStacking).toBe("single");
      expect(result.value.notificationDurationMs).toBe(6500);
      expect(result.value.notificationClosable).toBe(false);
      expect(result.value.notificationMaxVisible).toBe(1);
    }
  });

  it("clamps out-of-range notification numbers", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      notificationDurationMs: 15000,
      notificationMaxVisible: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("notificationDurationMs_out_of_range");
      expect(result.errors).toContain("notificationMaxVisible_out_of_range");
    }
  });

  it("defaults dismissed update banner version to null", () => {
    const result = validateUserSettings(createDefaultUserSettings());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.dismissedUpdateBannerVersion).toBeNull();
    }
  });

  it("accepts v5 codec preferences payload", () => {
    const defaults = createDefaultUserSettings();
    const result = validateUserSettings({
      ...defaults,
      codecPreferences: {
        ...defaults.codecPreferences,
        audio: defaults.codecPreferences.audio.map((entry) =>
          entry.id === "opus" ? { ...entry, enabled: false } : entry,
        ),
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.codecPreferences.audio.find((entry) => entry.id === "opus")?.enabled).toBe(
        false,
      );
    }
  });

  it("accepts video call preference fields", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      preferredAudioInputDeviceId: "mic-1",
      preferredVideoInputDeviceId: "cam-2",
      defaultSessionView: "expanded",
      autoFullscreenOnConference: true,
      conferenceNumberSubstring: "vconf-sel",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preferredAudioInputDeviceId).toBe("mic-1");
      expect(result.value.preferredVideoInputDeviceId).toBe("cam-2");
      expect(result.value.defaultSessionView).toBe("expanded");
      expect(result.value.autoFullscreenOnConference).toBe(true);
      expect(result.value.conferenceNumberSubstring).toBe("vconf-sel");
    }
  });

  it("defaults missing video preference fields", () => {
    const payload = { ...createDefaultUserSettings() } as Record<string, unknown>;
    delete payload["preferredAudioInputDeviceId"];
    delete payload["preferredVideoInputDeviceId"];
    delete payload["defaultSessionView"];
    delete payload["autoFullscreenOnConference"];
    delete payload["conferenceNumberSubstring"];
    const result = validateUserSettings(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preferredAudioInputDeviceId).toBeNull();
      expect(result.value.defaultSessionView).toBe("expanded");
      expect(result.value.autoFullscreenOnConference).toBe(false);
      expect(result.value.conferenceNumberSubstring).toBeNull();
    }
  });

  it("rejects invalid defaultSessionView", () => {
    const result = validateUserSettings({
      ...createDefaultUserSettings(),
      defaultSessionView: "minified",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("defaultSessionView_invalid");
    }
  });
});
