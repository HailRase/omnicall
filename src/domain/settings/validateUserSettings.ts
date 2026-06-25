import {
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "./SipRecoverySettings.js";
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
  const sipAutoReregisterEnabled = readBooleanWithDefault(
    record,
    "sipAutoReregisterEnabled",
    true,
    errors,
  );
  const sipReregisterIntervalSec = readSipReregisterInterval(record, errors);
  const sipReregisterMaxAttempts = readPositiveIntegerWithDefault(
    record,
    "sipReregisterMaxAttempts",
    DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
    errors,
  );

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
      sipAutoReregisterEnabled,
      sipReregisterIntervalSec,
      sipReregisterMaxAttempts,
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

function readBooleanWithDefault(
  record: Record<string, unknown>,
  field: string,
  defaultValue: boolean,
  errors: string[],
): boolean {
  const raw = record[field];
  if (raw === undefined) {
    return defaultValue;
  }
  if (typeof raw !== "boolean") {
    errors.push(`${field}_invalid`);
    return defaultValue;
  }
  return raw;
}

function readPositiveIntegerWithDefault(
  record: Record<string, unknown>,
  field: string,
  defaultValue: number,
  errors: string[],
): number {
  const raw = record[field];
  if (raw === undefined) {
    return defaultValue;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) {
    errors.push(`${field}_invalid`);
    return defaultValue;
  }
  return raw;
}

function readSipReregisterInterval(
  record: Record<string, unknown>,
  errors: string[],
): number {
  const raw = record["sipReregisterIntervalSec"];
  if (raw === undefined) {
    return DEFAULT_SIP_REREGISTER_INTERVAL_SEC;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("sipReregisterIntervalSec_invalid");
    return DEFAULT_SIP_REREGISTER_INTERVAL_SEC;
  }
  if (raw < MIN_SIP_REREGISTER_INTERVAL_SEC) {
    errors.push("sipReregisterIntervalSec_out_of_range");
    return MIN_SIP_REREGISTER_INTERVAL_SEC;
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
