import { parseAppTheme, type AppTheme } from "./AppTheme.js";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  parseSupportedLanguage,
  type SupportedLanguage,
} from "./SupportedLanguage.js";
import {
  DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
  DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
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
 * - Purpose: narrow unknown persisted JSON to UserSettings v2.
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

  const language = readLanguage(record, errors);
  const theme = readTheme(record, errors);
  const multiSessionsEnabled = readBoolean(record, "multiSessionsEnabled", errors);
  const autoUnholdOnTransferFailure = readBoolean(
    record,
    "autoUnholdOnTransferFailure",
    errors,
  );
  const autoAnswerTimeoutSec = readAutoAnswerTimeout(record, errors);
  const autoAnswerDuringActiveSessionEnabled = readBooleanWithDefault(
    record,
    "autoAnswerDuringActiveSessionEnabled",
    false,
    errors,
  );
  const ringbackToneEnabled = readBoolean(record, "ringbackToneEnabled", errors);
  const sipAutoReconnectEnabled = readBooleanWithDefault(
    record,
    "sipAutoReconnectEnabled",
    true,
    errors,
  );
  const sipReconnectIntervalSec = readSipReconnectInterval(record, errors);
  const sipReconnectMaxAttempts = readPositiveIntegerWithDefault(
    record,
    "sipReconnectMaxAttempts",
    DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
    errors,
  );
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
  const sipAutoRegisterOnStartup = readBooleanWithDefault(
    record,
    "sipAutoRegisterOnStartup",
    false,
    errors,
  );

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      language,
      theme,
      multiSessionsEnabled,
      autoUnholdOnTransferFailure,
      autoAnswerTimeoutSec,
      autoAnswerDuringActiveSessionEnabled,
      ringbackToneEnabled,
      sipAutoReconnectEnabled,
      sipReconnectIntervalSec,
      sipReconnectMaxAttempts,
      sipAutoReregisterEnabled,
      sipReregisterIntervalSec,
      sipReregisterMaxAttempts,
      sipAutoRegisterOnStartup,
    },
  };
}

function readLanguage(
  record: Record<string, unknown>,
  errors: string[],
): SupportedLanguage {
  const raw = record["language"];
  if (raw === undefined) {
    return DEFAULT_SUPPORTED_LANGUAGE;
  }
  const parsed = parseSupportedLanguage(raw);
  if (parsed === null) {
    errors.push("language_invalid");
    return DEFAULT_SUPPORTED_LANGUAGE;
  }
  return parsed;
}

function readTheme(record: Record<string, unknown>, errors: string[]): AppTheme {
  const raw = record["theme"];
  if (raw === undefined) {
    return "light";
  }
  const parsed = parseAppTheme(raw);
  if (parsed === null) {
    errors.push("theme_invalid");
    return "light";
  }
  return parsed;
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

function readSipReconnectInterval(
  record: Record<string, unknown>,
  errors: string[],
): number {
  const raw = record["sipReconnectIntervalSec"];
  if (raw === undefined) {
    return DEFAULT_SIP_RECONNECT_INTERVAL_SEC;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("sipReconnectIntervalSec_invalid");
    return DEFAULT_SIP_RECONNECT_INTERVAL_SEC;
  }
  if (raw < MIN_SIP_RECONNECT_INTERVAL_SEC) {
    errors.push("sipReconnectIntervalSec_out_of_range");
    return MIN_SIP_RECONNECT_INTERVAL_SEC;
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
