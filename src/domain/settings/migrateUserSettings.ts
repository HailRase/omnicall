import type { MultiCallSettings } from "../telephony/MultiCallPolicy.js";
import { createDefaultUserSettings, SETTINGS_SCHEMA_VERSION, type UserSettings } from "./UserSettings.js";
import { parseSupportedLanguage } from "./SupportedLanguage.js";
import { validateUserSettings } from "./validateUserSettings.js";
import {
  DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE,
  DEFAULT_CONFERENCE_NUMBER_SUBSTRING,
  DEFAULT_DEFAULT_SESSION_VIEW,
  DEFAULT_ENABLE_LOCAL_VIDEO_AFTER_CONNECT,
  DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID,
  DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID,
} from "./VideoCallSettings.js";
import {
  OCP_INTEGRATION_DEFAULTS,
  parseOcpIntegrationSettings,
} from "./OcpIntegrationSettings.js";
import {
  SDK_INTEGRATION_DEFAULTS,
  parseSdkIntegrationSettings,
} from "./SdkIntegrationSettings.js";
import {
  EXTERNAL_SERVICES_DEFAULTS,
  parseExternalServicesSettings,
} from "../integration/external-services/index.js";

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
 * - Purpose: upgrade persisted or in-memory settings to UserSettings v11.
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

  if (version === SETTINGS_SCHEMA_VERSION) {
    const validated = validateUserSettings(raw);
    if (!validated.ok) {
      return {
        ok: false,
        error: { code: "validation_failed", message: validated.errors.join(",") },
      };
    }
    return { ok: true, value: validated.value };
  }

  if (
    version === 11 ||
    version === 10 ||
    version === 9 ||
    version === 8 ||
    version === 7 ||
    version === 6 ||
    version === 5 ||
    version === 4 ||
    version === 3
  ) {
    return coerceToCurrentUserSettings(record);
  }

  if (version === 2) {
    return coerceToCurrentUserSettings({
      ...createDefaultUserSettings(),
      ...record,
      schemaVersion: SETTINGS_SCHEMA_VERSION,
    });
  }

  if (version === 1) {
    return { ok: true, value: migrateV1ToCurrent(record) };
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

function coerceToCurrentUserSettings(
  record: Record<string, unknown>,
): MigrateUserSettingsResult {
  const preferredRaw = record["headsetPreferredDeviceId"];
  const parsedOcp = parseOcpIntegrationSettings(record["ocpIntegration"]);
  if (parsedOcp === null) {
    return {
      ok: false,
      error: { code: "validation_failed", message: "ocpIntegration_invalid" },
    };
  }
  const parsedSdk = parseSdkIntegrationSettings(record["sdkIntegration"]);
  if (parsedSdk === null) {
    return {
      ok: false,
      error: { code: "validation_failed", message: "sdkIntegration_invalid" },
    };
  }
  const externalServices = parseExternalServicesForMigration(record);
  if (externalServices === null) {
    return {
      ok: false,
      error: {
        code: "validation_failed",
        message: "externalServices_invalid",
      },
    };
  }
  const candidate = {
    ...record,
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    headsetEnabled:
      typeof record["headsetEnabled"] === "boolean" ? record["headsetEnabled"] : false,
    headsetAutoReconnect:
      typeof record["headsetAutoReconnect"] === "boolean"
        ? record["headsetAutoReconnect"]
        : true,
    headsetPreferredDeviceId:
      typeof preferredRaw === "string" && preferredRaw.trim().length > 0
        ? preferredRaw.trim()
        : null,
    notificationPopupEnabled:
      typeof record["notificationPopupEnabled"] === "boolean"
        ? record["notificationPopupEnabled"]
        : true,
    preferredAudioInputDeviceId:
      typeof record["preferredAudioInputDeviceId"] === "string" ||
      record["preferredAudioInputDeviceId"] === null
        ? record["preferredAudioInputDeviceId"]
        : DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID,
    preferredVideoInputDeviceId:
      typeof record["preferredVideoInputDeviceId"] === "string" ||
      record["preferredVideoInputDeviceId"] === null
        ? record["preferredVideoInputDeviceId"]
        : DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID,
    defaultSessionView:
      typeof record["defaultSessionView"] === "string"
        ? record["defaultSessionView"]
        : DEFAULT_DEFAULT_SESSION_VIEW,
    autoFullscreenOnConference:
      typeof record["autoFullscreenOnConference"] === "boolean"
        ? record["autoFullscreenOnConference"]
        : DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE,
    conferenceNumberSubstring:
      typeof record["conferenceNumberSubstring"] === "string" ||
      record["conferenceNumberSubstring"] === null
        ? record["conferenceNumberSubstring"]
        : DEFAULT_CONFERENCE_NUMBER_SUBSTRING,
    enableLocalVideoAfterConnect:
      typeof record["enableLocalVideoAfterConnect"] === "boolean"
        ? record["enableLocalVideoAfterConnect"]
        : DEFAULT_ENABLE_LOCAL_VIDEO_AFTER_CONNECT,
    ocpIntegration: parsedOcp,
    sdkIntegration: parsedSdk,
    externalServices,
  };
  const validated = validateUserSettings(candidate);
  if (!validated.ok) {
    return {
      ok: false,
      error: { code: "validation_failed", message: validated.errors.join(",") },
    };
  }
  return { ok: true, value: validated.value };
}

function parseExternalServicesForMigration(
  record: Record<string, unknown>,
): UserSettings["externalServices"] | null {
  const raw = record["externalServices"];
  if (raw === undefined) {
    return EXTERNAL_SERVICES_DEFAULTS;
  }
  const parsed = parseExternalServicesSettings(raw);
  return parsed.ok ? parsed.value : null;
}

function migrateV1ToCurrent(record: Record<string, unknown>): UserSettings {
  const defaults = createDefaultUserSettings();
  const v1Validated = validateV1Fragments(record);
  const parsedLanguage = parseSupportedLanguage(record["language"]);

  return {
    schemaVersion: defaults.schemaVersion,
    language: parsedLanguage ?? defaults.language,
    theme: v1Validated.theme ?? defaults.theme,
    notificationPlacement: defaults.notificationPlacement,
    notificationStacking: defaults.notificationStacking,
    notificationDurationMs: defaults.notificationDurationMs,
    notificationClosable: defaults.notificationClosable,
    notificationMaxVisible: defaults.notificationMaxVisible,
    notificationPopupEnabled: defaults.notificationPopupEnabled,
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
    codecPreferences: defaults.codecPreferences,
    headsetEnabled: defaults.headsetEnabled,
    headsetAutoReconnect: defaults.headsetAutoReconnect,
    headsetPreferredDeviceId: defaults.headsetPreferredDeviceId,
    preferredAudioInputDeviceId: defaults.preferredAudioInputDeviceId,
    preferredVideoInputDeviceId: defaults.preferredVideoInputDeviceId,
    defaultSessionView: defaults.defaultSessionView,
    autoFullscreenOnConference: defaults.autoFullscreenOnConference,
    conferenceNumberSubstring: defaults.conferenceNumberSubstring,
    enableLocalVideoAfterConnect: defaults.enableLocalVideoAfterConnect,
    ocpIntegration: OCP_INTEGRATION_DEFAULTS,
    sdkIntegration: SDK_INTEGRATION_DEFAULTS,
    externalServices: EXTERNAL_SERVICES_DEFAULTS,
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
  const autoAnswerDuringActiveSessionEnabled =
    record["autoAnswerDuringActiveSessionEnabled"];
  const ringbackToneEnabled = record["ringbackToneEnabled"];
  const sipAutoReregisterEnabled = record["sipAutoReregisterEnabled"];
  const sipReregisterIntervalSec = record["sipReregisterIntervalSec"];
  const sipReregisterMaxAttempts = record["sipReregisterMaxAttempts"];

  return {
    ...(parsedTheme !== undefined ? { theme: parsedTheme } : {}),
    ...(typeof multiSessionsEnabled === "boolean"
      ? { multiSessionsEnabled }
      : {}),
    ...(typeof autoUnholdOnTransferFailure === "boolean"
      ? { autoUnholdOnTransferFailure }
      : {}),
    ...(autoAnswerTimeoutSec === null || typeof autoAnswerTimeoutSec === "number"
      ? { autoAnswerTimeoutSec }
      : {}),
    ...(typeof autoAnswerDuringActiveSessionEnabled === "boolean"
      ? { autoAnswerDuringActiveSessionEnabled }
      : {}),
    ...(typeof ringbackToneEnabled === "boolean" ? { ringbackToneEnabled } : {}),
    ...(typeof sipAutoReregisterEnabled === "boolean"
      ? { sipAutoReregisterEnabled }
      : {}),
    ...(typeof sipReregisterIntervalSec === "number"
      ? { sipReregisterIntervalSec }
      : {}),
    ...(typeof sipReregisterMaxAttempts === "number"
      ? { sipReregisterMaxAttempts }
      : {}),
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
  const multiCallSettings = record["multiCallSettings"];
  const autoAnswerTimeoutSec = record["autoAnswerTimeoutSec"];
  if (
    typeof multiCallSettings !== "object" ||
    multiCallSettings === null ||
    (autoAnswerTimeoutSec !== null && typeof autoAnswerTimeoutSec !== "number")
  ) {
    return null;
  }
  const multi = multiCallSettings as Record<string, unknown>;
  if (
    typeof multi["multiSessionsEnabled"] !== "boolean" ||
    typeof multi["autoUnholdOnTransferFailure"] !== "boolean"
  ) {
    return null;
  }
  return {
    multiCallSettings: {
      multiSessionsEnabled: multi["multiSessionsEnabled"],
      autoUnholdOnTransferFailure: multi["autoUnholdOnTransferFailure"],
    },
    autoAnswerTimeoutSec,
  };
}
