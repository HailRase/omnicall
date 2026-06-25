import {
  MAX_AUTO_ANSWER_TIMEOUT_SEC,
  SETTINGS_SCHEMA_VERSION,
  type UserSettings,
} from "./UserSettings.js";

export type ValidateUserSettingsResult =
  | Readonly<{ ok: true; value: UserSettings }>
  | Readonly<{ ok: false; errors: ReadonlyArray<string> }>;

/**
 * - Purpose: narrow unknown persisted JSON to UserSettings v1.
 * - Inputs: unknown payload from adapter boundary.
 * - Outputs: ok with UserSettings or structured validation errors.
 */
export function validateUserSettings(value: unknown): ValidateUserSettingsResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, errors: ["settings_not_object"] };
  }

  const record = value as Record<string, unknown>;
  const version = record["schemaVersion"];

  if (version !== SETTINGS_SCHEMA_VERSION) {
    return { ok: false, errors: ["unsupported_schema_version"] };
  }

  const errors: string[] = [];

  const multiSessionsEnabled = readBoolean(record, "multiSessionsEnabled", errors);
  const autoUnholdOnTransferFailure = readBoolean(
    record,
    "autoUnholdOnTransferFailure",
    errors,
  );
  const autoAnswerTimeoutSec = readAutoAnswerTimeout(record, errors);
  const ringbackToneEnabled = readBoolean(record, "ringbackToneEnabled", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      multiSessionsEnabled,
      autoUnholdOnTransferFailure,
      autoAnswerTimeoutSec,
      ringbackToneEnabled,
    },
  };
}

function readBoolean(
  record: Record<string, unknown>,
  field: string,
  errors: string[],
): boolean {
  const raw = record[field];
  if (typeof raw !== "boolean") {
    errors.push(`${field}_invalid`);
    return false;
  }
  return raw;
}

function readAutoAnswerTimeout(
  record: Record<string, unknown>,
  errors: string[],
): number | null {
  const raw = record["autoAnswerTimeoutSec"];
  if (raw === null) {
    return null;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("autoAnswerTimeoutSec_invalid");
    return null;
  }
  if (raw < 0 || raw > MAX_AUTO_ANSWER_TIMEOUT_SEC) {
    errors.push("autoAnswerTimeoutSec_out_of_range");
    return null;
  }
  return raw;
}
