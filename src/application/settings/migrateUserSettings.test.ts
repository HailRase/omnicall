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

  it("migrates v0 legacy fragments to v5", () => {
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
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.multiSessionsEnabled).toBe(false);
      expect(result.value.headsetEnabled).toBe(false);
      expect(result.value.headsetPreferredDeviceId).toBeNull();
      expect(result.value.defaultSessionView).toBe("expanded");
      expect(result.value.preferredVideoInputDeviceId).toBeNull();
    }
  });

  it("passes through valid current-schema payload", () => {
    const current = {
      ...createDefaultUserSettings(),
      multiSessionsEnabled: false,
      headsetPreferredDeviceId: "1:2:Headset",
    };
    const result = migrateUserSettings(current);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(current);
    }
  });

  it("migrates v6 payload to v8 with OCP integration defaults", () => {
    const v6 = {
      ...createDefaultUserSettings(),
      schemaVersion: 6 as const,
    };
    delete (v6 as { ocpIntegration?: unknown }).ocpIntegration;

    const result = migrateUserSettings(v6);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.ocpIntegration).toEqual({
        enabled: false,
        domain: "",
        autoConnect: false,
        linked: false,
      });
    }
  });

  it("preserves OCP settings when migrating v6 with values (legacy autoSipAuth → linked false)", () => {
    const v6 = {
      ...createDefaultUserSettings(),
      schemaVersion: 6 as const,
      ocpIntegration: {
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: true,
        autoSipAuth: true,
      },
    };
    const result = migrateUserSettings(v6);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.ocpIntegration).toEqual({
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: true,
        linked: false,
      });
    }
  });

  it("migrates v4 payload to v8 with headset, video, and OCP defaults", () => {
    const v4 = {
      ...createDefaultUserSettings(),
      schemaVersion: 4 as const,
    };
    delete (v4 as { headsetPreferredDeviceId?: unknown }).headsetPreferredDeviceId;
    delete (v4 as { preferredAudioInputDeviceId?: unknown }).preferredAudioInputDeviceId;
    delete (v4 as { preferredVideoInputDeviceId?: unknown }).preferredVideoInputDeviceId;
    delete (v4 as { defaultSessionView?: unknown }).defaultSessionView;
    delete (v4 as { autoFullscreenOnConference?: unknown }).autoFullscreenOnConference;
    delete (v4 as { conferenceNumberSubstring?: unknown }).conferenceNumberSubstring;

    const result = migrateUserSettings(v4);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.headsetPreferredDeviceId).toBeNull();
      expect(result.value.preferredAudioInputDeviceId).toBeNull();
      expect(result.value.preferredVideoInputDeviceId).toBeNull();
      expect(result.value.defaultSessionView).toBe("expanded");
      expect(result.value.autoFullscreenOnConference).toBe(false);
      expect(result.value.conferenceNumberSubstring).toBeNull();
    }
  });

  it("migrates v3 payload to v5 with headset and video defaults", () => {
    const v3 = {
      ...createDefaultUserSettings(),
      schemaVersion: 3 as const,
    };
    delete (v3 as { headsetEnabled?: unknown }).headsetEnabled;
    delete (v3 as { headsetAutoReconnect?: unknown }).headsetAutoReconnect;
    delete (v3 as { preferredVideoInputDeviceId?: unknown }).preferredVideoInputDeviceId;
    const result = migrateUserSettings(v3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.headsetEnabled).toBe(false);
      expect(result.value.headsetAutoReconnect).toBe(true);
      expect(result.value.headsetPreferredDeviceId).toBeNull();
      expect(result.value.defaultSessionView).toBe("expanded");
    }
  });

  it("migrates v2 payload to v5 with default codec preferences", () => {
    const v2 = {
      ...createDefaultUserSettings(),
      schemaVersion: 2 as const,
      multiSessionsEnabled: false,
    };
    delete (v2 as { codecPreferences?: unknown }).codecPreferences;

    const result = migrateUserSettings(v2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.codecPreferences).toEqual(createDefaultUserSettings().codecPreferences);
    }
  });

  it("migrates v1 payload to v5 with transport, codec, headset, and video defaults", () => {
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
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.theme).toBe("dark");
      expect(result.value.headsetEnabled).toBe(false);
      expect(result.value.autoFullscreenOnConference).toBe(false);
    }
  });

  it("preserves video preferences when migrating v4 with values", () => {
    const v4 = {
      ...createDefaultUserSettings(),
      schemaVersion: 4 as const,
      preferredVideoInputDeviceId: "camera-abc",
      defaultSessionView: "fullscreen" as const,
      autoFullscreenOnConference: true,
      conferenceNumberSubstring: "vconf-sel",
    };
    const result = migrateUserSettings(v4);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(8);
      expect(result.value.preferredVideoInputDeviceId).toBe("camera-abc");
      expect(result.value.defaultSessionView).toBe("fullscreen");
      expect(result.value.autoFullscreenOnConference).toBe(true);
      expect(result.value.conferenceNumberSubstring).toBe("vconf-sel");
    }
  });

  it("fails on unsupported schema version", () => {
    const result = migrateUserSettings({ schemaVersion: 99 });
    expect(result.ok).toBe(false);
  });

  it("fails on corrupt v5 payload", () => {
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
