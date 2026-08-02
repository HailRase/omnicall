import { describe, expect, it } from "vitest";
import {
  buildPreferencesExportDocument,
  createDefaultUserNotificationPreferences,
  createDefaultUserSettings,
  createPortableDefaultUserSettings,
  parseExternalServicesSettings,
  parsePreferencesExportDocument,
  parsePreferencesExportJson,
  PREFERENCES_EXPORT_FORMAT_ID,
  PREFERENCES_EXPORT_FORMAT_VERSION,
  serializePreferencesExportDocument,
  SETTINGS_SCHEMA_VERSION,
  toPortableUserSettings,
  type UserNotificationPreferences,
} from "@domain/index.js";

function createCustomNotificationPreferences(): UserNotificationPreferences {
  const defaults = createDefaultUserNotificationPreferences();
  return {
    masterInAppPopupEnabled: false,
    appearance: {
      placement: "top-left",
      stacking: "single",
      durationMs: 6500,
      closable: false,
      maxVisible: 1,
    },
    modules: {
      ...defaults.modules,
      sdk: { enabled: false, minLevel: "warning", raiseWindow: "never" },
      updates: { enabled: true, minLevel: "error", raiseWindow: "never" },
      externalServices: {
        enabled: true,
        minLevel: "info",
        raiseWindow: "errors_only",
      },
    },
  };
}

const EXTERNAL_SERVICES_FIXTURE = (() => {
  const parsed = parseExternalServicesSettings({
    collections: [
      {
        id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
        name: "CRM",
        enabled: true,
        variables: [{ key: "base_url", value: "https://crm.example.test" }],
        requests: [
          {
            id: "b0b1c2d3-e4f5-4a67-8b90-123456789012",
            name: "Notify",
            enabled: true,
            method: "POST",
            url: "{{base_url}}/events",
            query: [
              {
                id: "d0b1c2d3-e4f5-4a67-8b90-123456789012",
                key: "source",
                value: "softphone",
                enabled: true,
              },
            ],
            headers: [
              {
                id: "c0b1c2d3-e4f5-4a67-8b90-123456789012",
                key: "Authorization",
                value: "Bearer portable-authored-secret",
                enabled: true,
              },
            ],
            body: {
              mode: "json",
              value: "{\"event\":\"{{event_type}}\"}",
            },
            triggers: [
              { eventType: "call_answered", delaySeconds: 0 },
              { eventType: "incoming_ringing", delaySeconds: 0 },
            ],
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

describe("PreferencesExportDocument", () => {
  it("clears machine-local fields and resets ocp.linked on portable sanitize", () => {
    const settings = {
      ...createDefaultUserSettings(),
      preferredAudioInputDeviceId: "mic-1",
      preferredVideoInputDeviceId: "cam-1",
      headsetPreferredDeviceId: "1:2:Headset",
      dismissedUpdateBannerVersion: "0.12.0",
      ocpIntegration: {
        enabled: true,
        domain: "ocp.example.com",
        autoConnect: true,
        linked: true,
      },
    };

    const portable = toPortableUserSettings(settings);

    expect(portable.preferredAudioInputDeviceId).toBeNull();
    expect(portable.preferredVideoInputDeviceId).toBeNull();
    expect(portable.headsetPreferredDeviceId).toBeNull();
    expect(portable.dismissedUpdateBannerVersion).toBeNull();
    expect(portable.ocpIntegration).toEqual({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: true,
      linked: false,
    });
    expect(portable.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
  });

  it("round-trips serialize → parse for current settings", () => {
    const document = buildPreferencesExportDocument({
      settings: createDefaultUserSettings(),
      profileKey: "alice@example.com",
      appVersion: "0.12.0",
      exportedAt: "2026-07-24T12:00:00.000Z",
    });
    const json = serializePreferencesExportDocument(document);
    const parsed = parsePreferencesExportJson(json);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.format).toBe(PREFERENCES_EXPORT_FORMAT_ID);
    expect(parsed.value.formatVersion).toBe(PREFERENCES_EXPORT_FORMAT_VERSION);
    expect(parsed.value.profileKey).toBe("alice@example.com");
    expect(parsed.value.settings.language).toBe(document.settings.language);
    expect(parsed.value.settings.theme).toBe(document.settings.theme);
  });

  it("round-trips nested Notification Center preferences under formatVersion 1", () => {
    const notificationPreferences = createCustomNotificationPreferences();
    const document = buildPreferencesExportDocument({
      settings: {
        ...createDefaultUserSettings(),
        notificationPreferences,
      },
      profileKey: "alice@example.com",
      appVersion: "1.2.0",
      exportedAt: "2026-08-02T15:00:00.000Z",
    });
    const json = serializePreferencesExportDocument(document);

    expect(json).toContain("notificationPreferences");
    expect(json).toContain("masterInAppPopupEnabled");
    expect(json).toContain("\"sdk\"");
    expect(json).toContain("externalServices");
    expect(json).not.toContain("external-services-journal");
    expect(json).not.toContain("user-notification-journal");
    expect(json).not.toContain("suppressedAtEmission");

    const parsed = parsePreferencesExportJson(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.formatVersion).toBe(PREFERENCES_EXPORT_FORMAT_VERSION);
    expect(parsed.value.settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(parsed.value.settings.notificationPreferences).toEqual(notificationPreferences);
  });

  it("migrates v13 flat notification fields inside an F-030 bundle", () => {
    const defaults = createDefaultUserSettings();
    const v13Settings: Record<string, unknown> = {
      ...defaults,
      schemaVersion: 13,
      notificationPlacement: "top-left",
      notificationStacking: "single",
      notificationDurationMs: 6500,
      notificationClosable: false,
      notificationMaxVisible: 1,
      notificationPopupEnabled: false,
    };
    delete v13Settings["notificationPreferences"];

    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-08-02T15:00:00.000Z",
      appVersion: "1.1.0",
      profileKey: null,
      settings: v13Settings,
      transfer: {
        authMaterialOmitted: true,
        machineDeviceIdsCleared: true,
        ocpLinkedReset: true,
      },
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(parsed.value.settings.notificationPreferences).toEqual({
      masterInAppPopupEnabled: false,
      appearance: {
        placement: "top-left",
        stacking: "single",
        durationMs: 6500,
        closable: false,
        maxVisible: 1,
      },
      modules: defaults.notificationPreferences.modules,
    });
    expect(
      (parsed.value.settings as { notificationPopupEnabled?: unknown }).notificationPopupEnabled,
    ).toBeUndefined();
  });

  it("fails closed on malformed current-schema notification preferences", () => {
    const defaults = createDefaultUserSettings();
    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-08-02T15:00:00.000Z",
      settings: {
        ...defaults,
        notificationPreferences: {
          ...defaults.notificationPreferences,
          masterInAppPopupEnabled: "yes",
          appearance: {
            ...defaults.notificationPreferences.appearance,
            durationMs: 15000,
          },
        },
      },
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("settings_validation_failed");
    expect(parsed.error.message).toContain(
      "notificationPreferences.masterInAppPopupEnabled_invalid",
    );
    expect(parsed.error.message).toContain(
      "notificationPreferences.appearance.durationMs_out_of_range",
    );
  });

  it("round-trips External Services definitions exactly under formatVersion 1", () => {
    const document = buildPreferencesExportDocument({
      settings: {
        ...createDefaultUserSettings(),
        externalServices: EXTERNAL_SERVICES_FIXTURE,
      },
      profileKey: "alice@example.com",
      appVersion: "0.13.0",
      exportedAt: "2026-07-29T12:00:00.000Z",
    });
    const json = serializePreferencesExportDocument(document);

    expect(json).toContain("externalServices");
    expect(json).toContain("Bearer portable-authored-secret");
    expect(json).toContain("Authorization");
    expect(json.toLowerCase()).not.toContain("\"password\"");
    expect(json).not.toContain("external-services-journal");
    expect(json).not.toContain("\"journal\"");
    expect(json).not.toContain("manual_run");

    const parsed = parsePreferencesExportJson(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.formatVersion).toBe(PREFERENCES_EXPORT_FORMAT_VERSION);
    expect(parsed.value.settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(parsed.value.settings.externalServices).toEqual(EXTERNAL_SERVICES_FIXTURE);
  });

  it("preserves authored Authorization header values as portable configuration", () => {
    const document = buildPreferencesExportDocument({
      settings: {
        ...createDefaultUserSettings(),
        externalServices: EXTERNAL_SERVICES_FIXTURE,
      },
      exportedAt: "2026-07-29T12:00:00.000Z",
    });
    const parsed = parsePreferencesExportJson(
      serializePreferencesExportDocument(document),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const header =
      parsed.value.settings.externalServices.collections[0]?.requests[0]?.headers[0];
    expect(header).toEqual({
      id: "c0b1c2d3-e4f5-4a67-8b90-123456789012",
      key: "Authorization",
      value: "Bearer portable-authored-secret",
      enabled: true,
    });
  });

  it("migrates older UserSettings schema inside the bundle on import", () => {
    const current = createDefaultUserSettings();
    const raw = {
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-07-24T12:00:00.000Z",
      appVersion: "0.9.0",
      profileKey: null,
      settings: {
        ...current,
        schemaVersion: 10,
        language: "en",
        theme: "dark",
        multiSessionsEnabled: false,
        ocpIntegration: {
          enabled: true,
          domain: "ocp.example.com",
          autoConnect: true,
          linked: true,
        },
      },
      transfer: {
        authMaterialOmitted: true,
        machineDeviceIdsCleared: true,
        ocpLinkedReset: true,
      },
    };

    const parsed = parsePreferencesExportDocument(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    expect(parsed.value.settings.theme).toBe("dark");
    expect(parsed.value.settings.multiSessionsEnabled).toBe(false);
    expect(parsed.value.settings.language).toBe("en");
    expect(parsed.value.settings.ocpIntegration).toEqual({
      enabled: true,
      domain: "ocp.example.com",
      autoConnect: true,
      linked: false,
    });
    expect(parsed.value.settings.externalServices).toEqual({ collections: [] });
  });

  it("accepts LEGACY preferences format id and normalizes to omnicall.preferences", () => {
    const parsed = parsePreferencesExportDocument({
      format: "axatalk.preferences",
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-07-24T12:00:00.000Z",
      profileKey: "legacy@example.com",
      settings: createPortableDefaultUserSettings(),
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.format).toBe(PREFERENCES_EXPORT_FORMAT_ID);
    expect(parsed.value.profileKey).toBe("legacy@example.com");
  });

  it("fails closed on newer unsupported formatVersion", () => {
    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION + 1,
      exportedAt: "2026-07-24T12:00:00.000Z",
      settings: createPortableDefaultUserSettings(),
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("unsupported_format_version");
  });

  it("coerces newer settings schemaVersion from a portable bundle", () => {
    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-07-24T12:00:00.000Z",
      settings: {
        ...createDefaultUserSettings(),
        schemaVersion: SETTINGS_SCHEMA_VERSION + 4,
      },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
  });

  it("rejects secret-like field names in the payload", () => {
    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-07-24T12:00:00.000Z",
      settings: createDefaultUserSettings(),
      password: "leak",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("secret_field_forbidden");
  });
});
