import type { MultiCallSettings } from "../telephony/MultiCallPolicy.js";
import { createDefaultUserSettings, type UserSettings } from "./UserSettings.js";
import { parseSupportedLanguage } from "./SupportedLanguage.js";
import { validateUserSettings } from "./validateUserSettings.js";

export type UserSettingsV0Legacy = Readonly<{
  multiCallSettings: MultiCallSettings;
  autoAnswerTimeoutSec: number | null;
}>;

export type SettingsMigrationError = Readonly<{
  code: "unsupported_schema_version" | "validation_failed" | "migration_failed";
  message: string;
}>;

export type MigrateUserSettingsResult =
  | Readonly<{ ok: true; value: UserSettings }>
  | Readonly<{ ok: false; error: SettingsMigrationError }>;

/**
 * - Purpose: upgrade persisted or in-memory settings to UserSettings v2.
 * - Inputs: unknown raw blob and optional v0 legacy fragments.
 * - Outputs: migrated UserSettings or migration error.
 */
export function migrateUserSettings(
  raw: unknown,
  legacy?: UserSettingsV0Legacy,
): MigrateUserSettingsResult {
  if (raw === null || raw === undefined) {
    return { ok: true, value: migrateFromLegacy(legacy) };
  }

  if (typeof raw !== "object") {
    return {
      ok: false,
      error: { code: "migration_failed", message: "settings_payload_not_object" },
    };
  }

  const record = raw as Record<string, unknown>;
  const version = record["schemaVersion"];

  if (version === 2) {
    const validated = validateUserSettings(raw);
    if (!validated.ok) {
      return {
        ok: false,
        error: { code: "validation_failed", message: validated.errors.join(",") },
      };
    }
    return { ok: true, value: validated.value };
  }

  if (version === 1) {
    return { ok: true, value: migrateV1ToV2(record) };
  }

  if (version === 0 || version === undefined) {
    const v0 = readV0Fragments(record, legacy);
    if (v0 === null) {
      return {
        ok: false,
        error: { code: "migration_failed", message: "v0_fragments_missing" },
      };
    }
    return { ok: true, value: migrateFromLegacy(v0) };
  }

  return {
    ok: false,
    error: {
      code: "unsupported_schema_version",
      message: `unsupported_schema_version:${formatSchemaVersion(version)}`,
    },
  };
}

function formatSchemaVersion(version: unknown): string {
  if (typeof version === "string" || typeof version === "number" || typeof version === "boolean") {
    return String(version);
  }
  if (version === null) {
    return "null";
  }
  return "unknown";
}

function migrateV1ToV2(record: Record<string, unknown>): UserSettings {
  const defaults = createDefaultUserSettings();
  const v1Validated = validateV1Fragments(record);
  const parsedLanguage = parseSupportedLanguage(record["language"]);

  return {
    schemaVersion: defaults.schemaVersion,
    language: parsedLanguage ?? defaults.language,
    theme: v1Validated.theme ?? defaults.theme,
    multiSessionsEnabled: v1Validated.multiSessionsEnabled ?? defaults.multiSessionsEnabled,
    autoUnholdOnTransferFailure:
      v1Validated.autoUnholdOnTransferFailure ?? defaults.autoUnholdOnTransferFailure,
    autoAnswerTimeoutSec: v1Validated.autoAnswerTimeoutSec ?? defaults.autoAnswerTimeoutSec,
    autoAnswerDuringActiveSessionEnabled:
      v1Validated.autoAnswerDuringActiveSessionEnabled ??
      defaults.autoAnswerDuringActiveSessionEnabled,
    ringbackToneEnabled: v1Validated.ringbackToneEnabled ?? defaults.ringbackToneEnabled,
    sipAutoReconnectEnabled: defaults.sipAutoReconnectEnabled,
    sipReconnectIntervalSec: defaults.sipReconnectIntervalSec,
    sipReconnectMaxAttempts: defaults.sipReconnectMaxAttempts,
    sipAutoReregisterEnabled:
      v1Validated.sipAutoReregisterEnabled ?? defaults.sipAutoReregisterEnabled,
    sipReregisterIntervalSec:
      v1Validated.sipReregisterIntervalSec ?? defaults.sipReregisterIntervalSec,
    sipReregisterMaxAttempts:
      v1Validated.sipReregisterMaxAttempts ?? defaults.sipReregisterMaxAttempts,
    sipAutoRegisterOnStartup: defaults.sipAutoRegisterOnStartup,
    dismissedUpdateBannerVersion: defaults.dismissedUpdateBannerVersion,
  };
}

type V1Fragment = Readonly<{
  theme?: UserSettings["theme"];
  multiSessionsEnabled?: boolean;
  autoUnholdOnTransferFailure?: boolean;
  autoAnswerTimeoutSec?: number | null;
  autoAnswerDuringActiveSessionEnabled?: boolean;
  ringbackToneEnabled?: boolean;
  sipAutoReregisterEnabled?: boolean;
  sipReregisterIntervalSec?: number;
  sipReregisterMaxAttempts?: number;
}>;

function validateV1Fragments(record: Record<string, unknown>): V1Fragment {
  const theme = record["theme"];
  const parsedTheme =
    theme === "light" || theme === "dark" ? theme : undefined;

  const multiSessionsEnabled = record["multiSessionsEnabled"];
  const autoUnholdOnTransferFailure = record["autoUnholdOnTransferFailure"];
  const autoAnswerTimeoutSec = record["autoAnswerTimeoutSec"];
  const autoAnswerDuringActiveSessionEnabled = record["autoAnswerDuringActiveSessionEnabled"];
  const ringbackToneEnabled = record["ringbackToneEnabled"];
  const sipAutoReregisterEnabled = record["sipAutoReregisterEnabled"];
  const sipReregisterIntervalSec = record["sipReregisterIntervalSec"];
  const sipReregisterMaxAttempts = record["sipReregisterMaxAttempts"];

  return {
    ...(parsedTheme !== undefined ? { theme: parsedTheme } : {}),
    ...(typeof multiSessionsEnabled === "boolean" ? { multiSessionsEnabled } : {}),
    ...(typeof autoUnholdOnTransferFailure === "boolean"
      ? { autoUnholdOnTransferFailure }
      : {}),
    ...(autoAnswerTimeoutSec === null
      ? { autoAnswerTimeoutSec: null }
      : typeof autoAnswerTimeoutSec === "number"
        ? { autoAnswerTimeoutSec }
        : {}),
    ...(typeof autoAnswerDuringActiveSessionEnabled === "boolean"
      ? { autoAnswerDuringActiveSessionEnabled }
      : {}),
    ...(typeof ringbackToneEnabled === "boolean" ? { ringbackToneEnabled } : {}),
    ...(typeof sipAutoReregisterEnabled === "boolean" ? { sipAutoReregisterEnabled } : {}),
    ...(typeof sipReregisterIntervalSec === "number" ? { sipReregisterIntervalSec } : {}),
    ...(typeof sipReregisterMaxAttempts === "number" ? { sipReregisterMaxAttempts } : {}),
  };
}

function migrateFromLegacy(legacy?: UserSettingsV0Legacy): UserSettings {
  const defaults = createDefaultUserSettings();
  if (legacy === undefined) {
    return defaults;
  }

  return {
    ...defaults,
    multiSessionsEnabled: legacy.multiCallSettings.multiSessionsEnabled,
    autoUnholdOnTransferFailure:
      legacy.multiCallSettings.autoUnholdOnTransferFailure !== false,
    autoAnswerTimeoutSec: legacy.autoAnswerTimeoutSec,
  };
}

function readV0Fragments(
  record: Record<string, unknown>,
  legacy?: UserSettingsV0Legacy,
): UserSettingsV0Legacy | null {
  if (legacy !== undefined) {
    return legacy;
  }

  const multiRaw = record["multiCallSettings"];
  const autoAnswer = record["autoAnswerTimeoutSec"];

  if (typeof multiRaw !== "object" || multiRaw === null) {
    return null;
  }

  const multi = multiRaw as Record<string, unknown>;
  if (typeof multi["multiSessionsEnabled"] !== "boolean") {
    return null;
  }

  const autoUnhold = multi["autoUnholdOnTransferFailure"];
  const autoAnswerTimeoutSec =
    autoAnswer === null || autoAnswer === undefined
      ? null
      : typeof autoAnswer === "number"
        ? autoAnswer
        : null;

  return {
    multiCallSettings: {
      multiSessionsEnabled: multi["multiSessionsEnabled"],
      autoUnholdOnTransferFailure:
        typeof autoUnhold === "boolean" ? autoUnhold : true,
    },
    autoAnswerTimeoutSec,
  };
}
