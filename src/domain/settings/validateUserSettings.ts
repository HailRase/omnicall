import { parseAppTheme, type AppTheme } from "./AppTheme.js";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  parseSupportedLanguage,
  type SupportedLanguage,
} from "./SupportedLanguage.js";
import {
  clampNotificationDurationMs,
  clampNotificationMaxVisible,
  DEFAULT_NOTIFICATION_CLOSABLE,
  DEFAULT_NOTIFICATION_DURATION_MS,
  DEFAULT_NOTIFICATION_MAX_VISIBLE,
  DEFAULT_NOTIFICATION_PLACEMENT,
  DEFAULT_NOTIFICATION_STACKING,
  MAX_NOTIFICATION_DURATION_MS,
  MAX_NOTIFICATION_MAX_VISIBLE,
  MIN_NOTIFICATION_DURATION_MS,
  MIN_NOTIFICATION_MAX_VISIBLE,
  parseNotificationPlacement,
  parseNotificationStacking,
  type NotificationPlacement,
  type NotificationStacking,
} from "./NotificationSettings.js";
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
import { validateCodecPreferences } from "../media/validateCodecPreferences.js";
import { createDefaultCodecPreferences } from "../media/CodecPreferences.js";
import type { SessionViewMode } from "../media/SessionViewMode.js";
import {
  DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE,
  DEFAULT_CONFERENCE_NUMBER_SUBSTRING,
  DEFAULT_DEFAULT_SESSION_VIEW,
  DEFAULT_ENABLE_LOCAL_VIDEO_AFTER_CONNECT,
  DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID,
  DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID,
  parseConferenceNumberSubstring,
  parseDefaultSessionViewSetting,
  parsePreferredMediaDeviceId,
} from "./VideoCallSettings.js";
import {
  OCP_INTEGRATION_DEFAULTS,
  parseOcpIntegrationSettings,
  type OcpIntegrationSettings,
} from "./OcpIntegrationSettings.js";
import {
  parseSdkIntegrationSettings,
  type SdkIntegrationSettings,
} from "./SdkIntegrationSettings.js";

export type ValidateUserSettingsResult =
  | Readonly<{ ok: true; value: UserSettings }>
  | Readonly<{ ok: false; errors: ReadonlyArray<string> }>;

/**
 * - Purpose: narrow unknown persisted JSON to UserSettings.
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
  const notificationPlacement = readNotificationPlacement(record, errors);
  const notificationStacking = readNotificationStacking(record, errors);
  const notificationDurationMs = readNotificationDurationMs(record, errors);
  const notificationClosable = readNotificationClosable(record, errors);
  const notificationMaxVisible = readNotificationMaxVisible(record, errors);
  const notificationPopupEnabled = readBooleanWithDefault(
    record,
    "notificationPopupEnabled",
    true,
    errors,
  );
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
  const dismissedUpdateBannerVersion = readDismissedUpdateBannerVersion(record, errors);
  const codecPreferences = readCodecPreferences(record, errors);
  const headsetEnabled = readBooleanWithDefault(record, "headsetEnabled", false, errors);
  const headsetAutoReconnect = readBooleanWithDefault(
    record,
    "headsetAutoReconnect",
    true,
    errors,
  );
  const headsetPreferredDeviceId = readOptionalNonEmptyString(
    record,
    "headsetPreferredDeviceId",
    errors,
  );
  const preferredAudioInputDeviceId = readPreferredMediaDeviceId(
    record,
    "preferredAudioInputDeviceId",
    DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID,
    errors,
  );
  const preferredVideoInputDeviceId = readPreferredMediaDeviceId(
    record,
    "preferredVideoInputDeviceId",
    DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID,
    errors,
  );
  const defaultSessionView = readDefaultSessionView(record, errors);
  const autoFullscreenOnConference = readBooleanWithDefault(
    record,
    "autoFullscreenOnConference",
    DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE,
    errors,
  );
  const conferenceNumberSubstring = readConferenceNumberSubstring(record, errors);
  const enableLocalVideoAfterConnect = readBooleanWithDefault(
    record,
    "enableLocalVideoAfterConnect",
    DEFAULT_ENABLE_LOCAL_VIDEO_AFTER_CONNECT,
    errors,
  );
  const ocpIntegration = readOcpIntegration(record, errors);
  const sdkIntegration = readSdkIntegration(record, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      language,
      theme,
      notificationPlacement,
      notificationStacking,
      notificationDurationMs,
      notificationClosable,
      notificationMaxVisible,
      notificationPopupEnabled,
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
      dismissedUpdateBannerVersion,
      codecPreferences,
      headsetEnabled,
      headsetAutoReconnect,
      headsetPreferredDeviceId,
      preferredAudioInputDeviceId,
      preferredVideoInputDeviceId,
      defaultSessionView,
      autoFullscreenOnConference,
      conferenceNumberSubstring,
      enableLocalVideoAfterConnect,
      ocpIntegration,
      sdkIntegration,
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

function readNotificationPlacement(
  record: Record<string, unknown>,
  errors: string[],
): NotificationPlacement {
  const raw = record["notificationPlacement"];
  if (raw === undefined) {
    return DEFAULT_NOTIFICATION_PLACEMENT;
  }
  const parsed = parseNotificationPlacement(raw);
  if (parsed === null) {
    errors.push("notificationPlacement_invalid");
    return DEFAULT_NOTIFICATION_PLACEMENT;
  }
  return parsed;
}

function readNotificationStacking(
  record: Record<string, unknown>,
  errors: string[],
): NotificationStacking {
  const raw = record["notificationStacking"];
  if (raw === undefined) {
    return DEFAULT_NOTIFICATION_STACKING;
  }
  const parsed = parseNotificationStacking(raw);
  if (parsed === null) {
    errors.push("notificationStacking_invalid");
    return DEFAULT_NOTIFICATION_STACKING;
  }
  return parsed;
}

function readNotificationDurationMs(
  record: Record<string, unknown>,
  errors: string[],
): number {
  const raw = record["notificationDurationMs"];
  if (raw === undefined) {
    return DEFAULT_NOTIFICATION_DURATION_MS;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("notificationDurationMs_invalid");
    return DEFAULT_NOTIFICATION_DURATION_MS;
  }
  if (raw < MIN_NOTIFICATION_DURATION_MS || raw > MAX_NOTIFICATION_DURATION_MS) {
    errors.push("notificationDurationMs_out_of_range");
    return clampNotificationDurationMs(raw);
  }
  return raw;
}

function readNotificationClosable(
  record: Record<string, unknown>,
  errors: string[],
): boolean {
  return readBooleanWithDefault(
    record,
    "notificationClosable",
    DEFAULT_NOTIFICATION_CLOSABLE,
    errors,
  );
}

function readNotificationMaxVisible(
  record: Record<string, unknown>,
  errors: string[],
): number {
  const raw = record["notificationMaxVisible"];
  if (raw === undefined) {
    return DEFAULT_NOTIFICATION_MAX_VISIBLE;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    errors.push("notificationMaxVisible_invalid");
    return DEFAULT_NOTIFICATION_MAX_VISIBLE;
  }
  if (raw < MIN_NOTIFICATION_MAX_VISIBLE || raw > MAX_NOTIFICATION_MAX_VISIBLE) {
    errors.push("notificationMaxVisible_out_of_range");
    return clampNotificationMaxVisible(raw);
  }
  return raw;
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

function readDismissedUpdateBannerVersion(
  record: Record<string, unknown>,
  errors: string[],
): string | null {
  const raw = record["dismissedUpdateBannerVersion"];
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== "string" || raw.trim().length === 0) {
    errors.push("dismissedUpdateBannerVersion_invalid");
    return null;
  }
  return raw.trim();
}

function readOptionalNonEmptyString(
  record: Record<string, unknown>,
  field: string,
  errors: string[],
): string | null {
  const raw = record[field];
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== "string" || raw.trim().length === 0) {
    errors.push(`${field}_invalid`);
    return null;
  }
  return raw.trim();
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

function readCodecPreferences(
  record: Record<string, unknown>,
  errors: string[],
): UserSettings["codecPreferences"] {
  const validated = validateCodecPreferences(record["codecPreferences"]);
  if (!validated.ok) {
    errors.push(...validated.errors);
    return createDefaultCodecPreferences();
  }
  return validated.value;
}

function readPreferredMediaDeviceId(
  record: Record<string, unknown>,
  field: "preferredAudioInputDeviceId" | "preferredVideoInputDeviceId",
  defaultValue: string | null,
  errors: string[],
): string | null {
  const raw = record[field];
  if (raw === undefined) {
    return defaultValue;
  }
  const parsed = parsePreferredMediaDeviceId(raw);
  if (parsed === undefined) {
    errors.push(`${field}_invalid`);
    return defaultValue;
  }
  return parsed;
}

function readDefaultSessionView(
  record: Record<string, unknown>,
  errors: string[],
): SessionViewMode {
  const raw = record["defaultSessionView"];
  if (raw === undefined) {
    return DEFAULT_DEFAULT_SESSION_VIEW;
  }
  const parsed = parseDefaultSessionViewSetting(raw);
  if (parsed === null) {
    errors.push("defaultSessionView_invalid");
    return DEFAULT_DEFAULT_SESSION_VIEW;
  }
  return parsed;
}

function readConferenceNumberSubstring(
  record: Record<string, unknown>,
  errors: string[],
): string | null {
  const raw = record["conferenceNumberSubstring"];
  if (raw === undefined) {
    return DEFAULT_CONFERENCE_NUMBER_SUBSTRING;
  }
  const parsed = parseConferenceNumberSubstring(raw);
  if (parsed === undefined) {
    errors.push("conferenceNumberSubstring_invalid");
    return DEFAULT_CONFERENCE_NUMBER_SUBSTRING;
  }
  return parsed;
}

function readOcpIntegration(
  record: Record<string, unknown>,
  errors: string[],
): OcpIntegrationSettings {
  const parsed = parseOcpIntegrationSettings(record["ocpIntegration"]);
  if (parsed === null) {
    errors.push("ocpIntegration_invalid");
    return { ...OCP_INTEGRATION_DEFAULTS };
  }
  return parsed;
}

function readSdkIntegration(
  record: Record<string, unknown>,
  errors: string[],
): SdkIntegrationSettings {
  const parsed = parseSdkIntegrationSettings(record["sdkIntegration"]);
  if (parsed === null) {
    errors.push("sdkIntegration_invalid");
    return {
      enabled: true,
      allowedOrigins: [],
      originsManaged: false,
    };
  }
  return parsed;
}
