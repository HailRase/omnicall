import type { MultiCallSettings } from "../telephony/MultiCallPolicy.js";
import { createDefaultUserSettings, type UserSettings } from "./UserSettings.js";
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
 * - Purpose: upgrade persisted or in-memory settings to UserSettings v1.
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

  if (version === 1) {
    const validated = validateUserSettings(raw);
    if (!validated.ok) {
      return {
        ok: false,
        error: { code: "validation_failed", message: validated.errors.join(",") },
      };
    }
    return { ok: true, value: validated.value };
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

function migrateFromLegacy(legacy?: UserSettingsV0Legacy): UserSettings {
  const defaults = createDefaultUserSettings();
  if (legacy === undefined) {
    return defaults;
  }

  return {
    schemaVersion: defaults.schemaVersion,
    multiSessionsEnabled: legacy.multiCallSettings.multiSessionsEnabled,
    autoUnholdOnTransferFailure:
      legacy.multiCallSettings.autoUnholdOnTransferFailure !== false,
    autoAnswerTimeoutSec: legacy.autoAnswerTimeoutSec,
    ringbackToneEnabled: defaults.ringbackToneEnabled,
    sipAutoReregisterEnabled: defaults.sipAutoReregisterEnabled,
    sipReregisterIntervalSec: defaults.sipReregisterIntervalSec,
    sipReregisterMaxAttempts: defaults.sipReregisterMaxAttempts,
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
