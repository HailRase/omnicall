import { describe, expect, it } from "vitest";
import {
  buildPreferencesExportDocument,
  createDefaultUserSettings,
  createPortableDefaultUserSettings,
  parsePreferencesExportDocument,
  parsePreferencesExportJson,
  PREFERENCES_EXPORT_FORMAT_ID,
  PREFERENCES_EXPORT_FORMAT_VERSION,
  serializePreferencesExportDocument,
  SETTINGS_SCHEMA_VERSION,
  toPortableUserSettings,
} from "@domain/index.js";

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

  it("fails closed when settings schemaVersion is newer than this app", () => {
    const parsed = parsePreferencesExportDocument({
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: "2026-07-24T12:00:00.000Z",
      settings: {
        ...createDefaultUserSettings(),
        schemaVersion: SETTINGS_SCHEMA_VERSION + 1,
      },
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("settings_migration_failed");
    expect(parsed.error.message).toContain("unsupported_schema_version");
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
