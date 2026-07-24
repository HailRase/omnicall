import {
  createDefaultUserSettings,
  SETTINGS_SCHEMA_VERSION,
  type UserSettings,
} from "./UserSettings.js";
import { migrateUserSettings } from "./migrateUserSettings.js";
import { OCP_INTEGRATION_DEFAULTS } from "./OcpIntegrationSettings.js";

/** Stable document id for operator preferences transfer files. */
export const PREFERENCES_EXPORT_FORMAT_ID = "axatalk.preferences" as const;

/** Bundle format version (independent from UserSettings.schemaVersion). */
export const PREFERENCES_EXPORT_FORMAT_VERSION = 1 as const;

export type PreferencesExportFormatId = typeof PREFERENCES_EXPORT_FORMAT_ID;
export type PreferencesExportFormatVersion = typeof PREFERENCES_EXPORT_FORMAT_VERSION;

export type PreferencesExportDocumentV1 = Readonly<{
  format: PreferencesExportFormatId;
  formatVersion: PreferencesExportFormatVersion;
  exportedAt: string;
  appVersion: string | null;
  profileKey: string | null;
  settings: UserSettings;
  transfer: Readonly<{
    /** Passwords / API keys / pairing blobs are never included. */
    authMaterialOmitted: true;
    machineDeviceIdsCleared: true;
    ocpLinkedReset: true;
  }>;
}>;

export type PreferencesExportParseErrorCode =
  | "payload_not_object"
  | "unsupported_format"
  | "unsupported_format_version"
  | "invalid_exported_at"
  | "settings_migration_failed"
  | "settings_validation_failed"
  | "secret_field_forbidden";

export type PreferencesExportParseResult =
  | Readonly<{ ok: true; value: PreferencesExportDocumentV1 }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: PreferencesExportParseErrorCode; message: string }>;
    }>;

const FORBIDDEN_SECRET_FIELD_FRAGMENTS = [
  "password",
  "token",
  "credential",
  "secret",
] as const;

/**
 * - Purpose: strip machine-local and non-portable fields before export/import.
 * - Inputs: validated UserSettings aggregate.
 * - Outputs: portable UserSettings safe to move across PCs (no secrets).
 */
export function toPortableUserSettings(settings: UserSettings): UserSettings {
  return {
    ...settings,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    preferredAudioInputDeviceId: null,
    preferredVideoInputDeviceId: null,
    headsetPreferredDeviceId: null,
    dismissedUpdateBannerVersion: null,
    ocpIntegration: {
      ...settings.ocpIntegration,
      linked: false,
    },
  };
}

/**
 * - Purpose: build a v1 preferences export document for the active profile.
 * - Inputs: settings, optional profile key / app version, export clock.
 * - Outputs: typed document ready for JSON serialization.
 */
export function buildPreferencesExportDocument(input: Readonly<{
  settings: UserSettings;
  profileKey?: string | null;
  appVersion?: string | null;
  exportedAt?: string;
}>): PreferencesExportDocumentV1 {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  return {
    format: PREFERENCES_EXPORT_FORMAT_ID,
    formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
    exportedAt,
    appVersion: normalizeOptionalString(input.appVersion),
    profileKey: normalizeOptionalString(input.profileKey),
    settings: toPortableUserSettings(input.settings),
    transfer: {
      authMaterialOmitted: true,
      machineDeviceIdsCleared: true,
      ocpLinkedReset: true,
    },
  };
}

/**
 * - Purpose: serialize preferences export document to JSON text.
 * - Inputs: typed v1 document.
 * - Outputs: UTF-8 JSON string; throws when secret-like fields appear.
 */
export function serializePreferencesExportDocument(
  document: PreferencesExportDocumentV1,
): string {
  const json = `${JSON.stringify(document, null, 2)}\n`;
  assertPreferencesJsonExcludesSecrets(json);
  return json;
}

/**
 * - Purpose: parse unknown JSON into a portable preferences export document.
 * - Inputs: unknown boundary payload (file contents after JSON.parse).
 * - Outputs: migrated portable document or fail-closed parse error.
 */
export function parsePreferencesExportDocument(raw: unknown): PreferencesExportParseResult {
  if (typeof raw !== "object" || raw === null) {
    return fail("payload_not_object", "preferences_payload_not_object");
  }

  try {
    assertPreferencesJsonExcludesSecrets(JSON.stringify(raw));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "secret_field_forbidden";
    return fail("secret_field_forbidden", message);
  }

  const record = raw as Record<string, unknown>;
  if (record["format"] !== PREFERENCES_EXPORT_FORMAT_ID) {
    return fail("unsupported_format", "preferences_unsupported_format");
  }

  const formatVersion = record["formatVersion"];
  if (formatVersion !== PREFERENCES_EXPORT_FORMAT_VERSION) {
    return fail(
      "unsupported_format_version",
      `preferences_unsupported_format_version:${String(formatVersion)}`,
    );
  }

  const exportedAt = record["exportedAt"];
  if (typeof exportedAt !== "string" || exportedAt.trim().length === 0) {
    return fail("invalid_exported_at", "preferences_exported_at_invalid");
  }

  const settingsRaw = record["settings"];
  const migrated = migrateUserSettings(settingsRaw);
  if (!migrated.ok) {
    if (migrated.error.code === "unsupported_schema_version") {
      return fail("settings_migration_failed", migrated.error.message);
    }
    if (migrated.error.code === "validation_failed") {
      return fail("settings_validation_failed", migrated.error.message);
    }
    return fail("settings_migration_failed", migrated.error.message);
  }

  const portable = toPortableUserSettings(migrated.value);
  return {
    ok: true,
    value: {
      format: PREFERENCES_EXPORT_FORMAT_ID,
      formatVersion: PREFERENCES_EXPORT_FORMAT_VERSION,
      exportedAt: exportedAt.trim(),
      appVersion: normalizeOptionalString(record["appVersion"]),
      profileKey: normalizeOptionalString(record["profileKey"]),
      settings: portable,
      transfer: {
        authMaterialOmitted: true,
        machineDeviceIdsCleared: true,
        ocpLinkedReset: true,
      },
    },
  };
}

/**
 * - Purpose: parse preferences export JSON text at the application boundary.
 * - Inputs: UTF-8 file contents.
 * - Outputs: parse result after JSON.decode + document validation.
 */
export function parsePreferencesExportJson(json: string): PreferencesExportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return fail("payload_not_object", "preferences_json_invalid");
  }
  return parsePreferencesExportDocument(parsed);
}

/**
 * - Purpose: defaults used when building empty portable settings snapshots in tests.
 * - Inputs: none.
 * - Outputs: portable defaults (device ids cleared, ocp.linked false).
 */
export function createPortableDefaultUserSettings(): UserSettings {
  return toPortableUserSettings({
    ...createDefaultUserSettings(),
    ocpIntegration: { ...OCP_INTEGRATION_DEFAULTS },
  });
}

/**
 * - Purpose: reject preferences JSON that contains secret-like field names.
 * - Inputs: serialized JSON text.
 * - Outputs: void or throws preferences_secret_field_forbidden error.
 */
export function assertPreferencesJsonExcludesSecrets(json: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return;
  }
  scanValueForForbiddenSecretFields(parsed);
}

function scanValueForForbiddenSecretFields(value: unknown): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      scanValueForForbiddenSecretFields(entry);
    }
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
  for (const [fieldName, nestedValue] of Object.entries(value)) {
    if (isForbiddenSecretFieldName(fieldName)) {
      throw new Error(`preferences_secret_field_forbidden:${fieldName}`);
    }
    scanValueForForbiddenSecretFields(nestedValue);
  }
}

function isForbiddenSecretFieldName(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return FORBIDDEN_SECRET_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function fail(
  code: PreferencesExportParseErrorCode,
  message: string,
): PreferencesExportParseResult {
  return { ok: false, error: { code, message } };
}
