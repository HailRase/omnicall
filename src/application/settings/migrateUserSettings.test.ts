import { describe, expect, it } from "vitest";
import {
  SETTINGS_SCHEMA_VERSION,
  createDefaultUserSettings,
} from "@domain/settings/UserSettings.js";
import { SDK_INTEGRATION_DEFAULTS } from "@domain/settings/SdkIntegrationSettings.js";
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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

  it("migrates v16 settings and defaults windowAlwaysOnTop to false", () => {
    const v16 = {
      ...createDefaultUserSettings(),
      schemaVersion: 16 as const,
    };
    delete (v16 as { windowAlwaysOnTop?: unknown }).windowAlwaysOnTop;

    const result = migrateUserSettings(v16);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.windowAlwaysOnTop).toBe(false);
    }
  });

  it("migrates v17 settings and defaults incomingRingtoneId to classic", () => {
    const v17 = {
      ...createDefaultUserSettings(),
      schemaVersion: 17 as const,
    };
    delete (v17 as { incomingRingtoneId?: unknown }).incomingRingtoneId;

    const result = migrateUserSettings(v17);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.incomingRingtoneId).toBe("classic");
    }
  });

  it("preserves incomingRingtoneId when migrating from v17", () => {
    const v17 = {
      ...createDefaultUserSettings(),
      schemaVersion: 17 as const,
      incomingRingtoneId: "soft-chime" as const,
    };
    const result = migrateUserSettings(v17);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.incomingRingtoneId).toBe("soft-chime");
    }
  });

  it("maps unknown incomingRingtoneId to classic during migration", () => {
    const v17 = {
      ...createDefaultUserSettings(),
      schemaVersion: 17 as const,
      incomingRingtoneId: "iphone-official",
    };
    const result = migrateUserSettings(v17);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.incomingRingtoneId).toBe("classic");
    }
  });

  it("preserves windowAlwaysOnTop when migrating from v16", () => {
    const v16 = {
      ...createDefaultUserSettings(),
      schemaVersion: 16 as const,
      windowAlwaysOnTop: true,
    };
    const result = migrateUserSettings(v16);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.windowAlwaysOnTop).toBe(true);
    }
  });

  it("migrates v11 with an External Services default without data loss", () => {
    const v11 = {
      ...createDefaultUserSettings(),
      schemaVersion: 11 as const,
    };
    delete (v11 as { externalServices?: unknown }).externalServices;

    const result = migrateUserSettings(v11);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.externalServices).toEqual({ collections: [] });
    }
  });

  it("preserves validated External Services data from v11", () => {
    const v11 = {
      ...createDefaultUserSettings(),
      schemaVersion: 11 as const,
      externalServices: {
        collections: [
          {
            id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
            name: "CRM",
            enabled: true,
            variables: [],
            requests: [],
          },
        ],
      },
    };

    const result = migrateUserSettings(v11);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.externalServices.collections[0]?.name).toBe("CRM");
    }
  });

  it("migrates v13 settings to current with empty External Applications defaults", () => {
    const v13 = {
      ...createDefaultUserSettings(),
      schemaVersion: 13 as const,
    };
    const withoutApps = { ...v13 } as Record<string, unknown>;
    delete withoutApps["externalApplications"];

    const result = migrateUserSettings(withoutApps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.externalApplications.applications).toEqual([]);
    }
  });

  it("migrates v13 flat notification fields to nested preferences", () => {
    const v13 = {
      ...createDefaultUserSettings(),
      schemaVersion: 13 as const,
      notificationPlacement: "top-left" as const,
      notificationStacking: "single" as const,
      notificationDurationMs: 6500,
      notificationClosable: false,
      notificationMaxVisible: 1,
      notificationPopupEnabled: false,
    };
    delete (v13 as { notificationPreferences?: unknown }).notificationPreferences;

    const result = migrateUserSettings(v13);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.notificationPreferences.masterInAppPopupEnabled).toBe(false);
      expect(result.value.notificationPreferences.appearance).toEqual({
        placement: "top-left",
        stacking: "single",
        durationMs: 6500,
        closable: false,
        maxVisible: 1,
      });
      expect(result.value.notificationPreferences.modules.system.enabled).toBe(true);
      expect(result.value.notificationPreferences.modules.sdk.enabled).toBe(true);
      expect(
        (result.value as { notificationPopupEnabled?: unknown }).notificationPopupEnabled,
      ).toBeUndefined();
    }
  });

  it("preserves default popup-on behavior when migrating v13 without custom notification fields", () => {
    const defaults = createDefaultUserSettings();
    const v13 = {
      ...defaults,
      schemaVersion: 13 as const,
      notificationPlacement: "bottom-right" as const,
      notificationStacking: "stacked" as const,
      notificationDurationMs: 4200,
      notificationClosable: true,
      notificationMaxVisible: 3,
      notificationPopupEnabled: true,
    };
    delete (v13 as { notificationPreferences?: unknown }).notificationPreferences;

    const result = migrateUserSettings(v13);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.notificationPreferences).toEqual(defaults.notificationPreferences);
    }
  });

  it("migrates v14 External Applications with missing conditions to current defaults", () => {
    const applicationId = "11111111-1111-4111-8111-111111111111";
    const v14 = {
      ...createDefaultUserSettings(),
      schemaVersion: 14 as const,
      externalApplications: {
        applications: [
          {
            id: applicationId,
            name: "CRM",
            enabled: true,
            urlTemplate: "https://crm.example.test/{{call_id}}",
            openMode: "electron_window",
            window: { width: 1100, height: 800 },
            variables: [],
            triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
          },
        ],
      },
    };

    const result = migrateUserSettings(v14);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.externalApplications.applications[0]?.conditions).toEqual({
        callDirection: "any",
        queueNames: [],
      });
      expect(result.value.externalApplications.applications[0]?.windowBehavior).toEqual({
        raiseOnOpen: true,
        alwaysOnTopDuringCall: false,
        onCallEnded: "leave",
      });
      expect(result.value.externalApplications.applications[0]?.window).toEqual({
        width: 1100,
        height: 800,
        x: 100,
        y: 100,
      });
    }
  });

  it("migrates v15 queueNameEquals into queueNames list", () => {
    const applicationId = "11111111-1111-4111-8111-111111111111";
    const v15 = {
      ...createDefaultUserSettings(),
      schemaVersion: 15 as const,
      externalApplications: {
        applications: [
          {
            id: applicationId,
            name: "CRM",
            enabled: true,
            urlTemplate: "https://crm.example.test/{{call_id}}",
            openMode: "electron_window",
            window: { width: 1100, height: 800 },
            variables: [],
            triggers: [{ eventType: "incoming_ringing", delaySeconds: 0 }],
            conditions: {
              callDirection: "any",
              requireCallerId: false,
              queueNameEquals: "Sales",
            },
            windowBehavior: {
              raiseOnOpen: true,
              alwaysOnTopDuringCall: false,
              onCallEnded: "leave",
            },
          },
        ],
      },
    };

    const result = migrateUserSettings(v15);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.externalApplications.applications[0]?.conditions).toEqual({
        callDirection: "any",
        queueNames: ["Sales"],
      });
    }
  });

  it("migrates v18 flat notifications to nested prefs without losing EA fields", () => {
    const v18 = {
      ...createDefaultUserSettings(),
      schemaVersion: 18 as const,
      notificationPlacement: "bottom-left" as const,
      notificationStacking: "stacked" as const,
      notificationDurationMs: 4200,
      notificationClosable: true,
      notificationMaxVisible: 3,
      notificationPopupEnabled: true,
      windowAlwaysOnTop: true,
    };
    delete (v18 as { notificationPreferences?: unknown }).notificationPreferences;

    const result = migrateUserSettings(v18);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.windowAlwaysOnTop).toBe(true);
      expect(result.value.notificationPreferences.appearance.placement).toBe(
        "bottom-left",
      );
      expect(result.value.externalApplications).toEqual(
        createDefaultUserSettings().externalApplications,
      );
    }
  });

  it("migrates v12 string triggers to v13 delay bindings without losing codes", () => {
    const v12 = {
      ...createDefaultUserSettings(),
      schemaVersion: 12 as const,
      externalServices: {
        collections: [
          {
            id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
            name: "CRM",
            enabled: true,
            variables: [],
            requests: [
              {
                id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
                name: "Notify",
                enabled: true,
                method: "POST",
                url: "https://crm.example.test/events",
                query: [],
                headers: [],
                body: { mode: "none", value: "" },
                triggers: ["call_answered", "incoming_ringing"],
              },
            ],
          },
        ],
      },
    };

    const result = migrateUserSettings(v12);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.externalServices.collections[0]?.requests[0]?.triggers).toEqual([
        { eventType: "call_answered", delaySeconds: 0 },
        { eventType: "incoming_ringing", delaySeconds: 0 },
      ]);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.ocpIntegration).toEqual({
        enabled: false,
        domain: "",
        autoConnect: false,
        linked: false,
      });
    }
  });

  it("migrates v9 payload to v10 with SDK integration defaults (fail closed)", () => {
    const v9 = {
      ...createDefaultUserSettings(),
      schemaVersion: 9 as const,
    };
    delete (v9 as { sdkIntegration?: unknown }).sdkIntegration;

    const result = migrateUserSettings(v9);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.sdkIntegration).toEqual({
        origins: [],
        originsManaged: false,
        operatorModalTimeouts: SDK_INTEGRATION_DEFAULTS.operatorModalTimeouts,
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
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
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.preferredVideoInputDeviceId).toBe("camera-abc");
      expect(result.value.defaultSessionView).toBe("fullscreen");
      expect(result.value.autoFullscreenOnConference).toBe(true);
      expect(result.value.conferenceNumberSubstring).toBe("vconf-sel");
    }
  });

  it("best-effort coerces newer integer schema versions keeping known fields", () => {
    const result = migrateUserSettings({
      schemaVersion: 99,
      language: "en",
      theme: "dark",
      notificationPlacement: "top-left",
      notificationStacking: "single",
      notificationDurationMs: 5000,
      notificationClosable: true,
      notificationMaxVisible: 2,
      notificationPopupEnabled: false,
      multiSessionsEnabled: true,
      autoUnholdOnTransferFailure: true,
      autoAnswerTimeoutSec: null,
      autoAnswerDuringActiveSessionEnabled: false,
      ringbackToneEnabled: true,
      sipAutoReconnectEnabled: true,
      sipReconnectIntervalSec: 5,
      sipReconnectMaxAttempts: 5,
      sipAutoReregisterEnabled: true,
      sipReregisterIntervalSec: 5,
      sipReregisterMaxAttempts: 5,
      sipAutoRegisterOnStartup: false,
      dismissedUpdateBannerVersion: null,
      codecPreferences: createDefaultUserSettings().codecPreferences,
      headsetEnabled: false,
      headsetAutoReconnect: true,
      headsetPreferredDeviceId: null,
      preferredAudioInputDeviceId: null,
      preferredVideoInputDeviceId: null,
      defaultSessionView: "expanded",
      autoFullscreenOnConference: false,
      conferenceNumberSubstring: null,
      enableLocalVideoAfterConnect: false,
      ocpIntegration: createDefaultUserSettings().ocpIntegration,
      sdkIntegration: createDefaultUserSettings().sdkIntegration,
      externalServices: createDefaultUserSettings().externalServices,
      incomingRingtoneId: "classic",
      windowAlwaysOnTop: true,
      externalApplications: { applications: [] },
      // Truly unknown future keys must not block migration.
      futureOnlyPreference: { enabled: true },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
      expect(result.value.language).toBe("en");
      expect(result.value.theme).toBe("dark");
      expect(result.value.notificationPreferences.masterInAppPopupEnabled).toBe(
        false,
      );
      expect(result.value.notificationPreferences.appearance.placement).toBe(
        "top-left",
      );
      expect(result.value.incomingRingtoneId).toBe("classic");
      expect(result.value.windowAlwaysOnTop).toBe(true);
      expect(result.value.externalApplications.applications).toEqual([]);
      expect("futureOnlyPreference" in result.value).toBe(false);
    }
  });

  it("fails on non-integer unsupported schema version", () => {
    const result = migrateUserSettings({ schemaVersion: "eighteen" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Application wrapper maps domain migration errors to PlatformError validation_failed.
      expect(result.error.code).toBe("validation_failed");
      expect(result.error.message).toContain("unsupported_schema_version");
    }
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
