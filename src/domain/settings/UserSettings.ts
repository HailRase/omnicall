import { DEFAULT_APP_THEME, type AppTheme } from "./AppTheme.js";
import {
  createDefaultCodecPreferences,
  type CodecPreferences,
} from "../media/CodecPreferences.js";
import {
  DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
  DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
  DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
  DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
  MIN_SIP_RECONNECT_INTERVAL_SEC,
  MIN_SIP_REREGISTER_INTERVAL_SEC,
} from "./SipRecoverySettings.js";
import {
  DEFAULT_SUPPORTED_LANGUAGE,
  type SupportedLanguage,
} from "./SupportedLanguage.js";
import type { SessionViewMode } from "../media/SessionViewMode.js";
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
  type OcpIntegrationSettings,
} from "./OcpIntegrationSettings.js";
import {
  SDK_INTEGRATION_DEFAULTS,
  type SdkIntegrationSettings,
} from "./SdkIntegrationSettings.js";
import {
  EXTERNAL_SERVICES_DEFAULTS,
  type ExternalServicesSettings,
} from "../integration/external-services/ExternalServicesSettings.js";
import {
  EXTERNAL_APPLICATIONS_DEFAULTS,
  type ExternalApplicationsSettings,
} from "../integration/external-applications/ExternalApplicationsSettings.js";
import {
  DEFAULT_INCOMING_RINGTONE_ID,
  type IncomingRingtoneId,
} from "../media/IncomingRingtoneId.js";
import {
  createDefaultUserNotificationPreferences,
  type UserNotificationPreferences,
} from "./UserNotificationPreferences.js";

/**
 * v19 = v18 (EA / ringtone / always-on-top) + nested Notification Center preferences.
 * Never downgrade below the highest shipped parallel-branch schema (18).
 */
export const SETTINGS_SCHEMA_VERSION = 19 as const;

export type SettingsSchemaVersion = typeof SETTINGS_SCHEMA_VERSION;

/** Max auto-answer delay (seconds) aligned with legacy operator UX. */
export const MAX_AUTO_ANSWER_TIMEOUT_SEC = 300;

export type UserSettings = Readonly<{
  schemaVersion: SettingsSchemaVersion;
  language: SupportedLanguage;
  theme: AppTheme;
  /** Nested Notification Center preferences (Strategy A; schema v19). */
  notificationPreferences: UserNotificationPreferences;
  multiSessionsEnabled: boolean;
  autoUnholdOnTransferFailure: boolean;
  autoAnswerTimeoutSec: number | null;
  autoAnswerDuringActiveSessionEnabled: boolean;
  ringbackToneEnabled: boolean;
  /** Selected incoming ringtone preset; classic preserves pre-v18 WebAudio dual-tone. */
  incomingRingtoneId: IncomingRingtoneId;
  sipAutoReconnectEnabled: boolean;
  sipReconnectIntervalSec: number;
  sipReconnectMaxAttempts: number;
  sipAutoReregisterEnabled: boolean;
  sipReregisterIntervalSec: number;
  sipReregisterMaxAttempts: number;
  sipAutoRegisterOnStartup: boolean;
  /** Suppress startup update banner until manifest reports a newer version. */
  dismissedUpdateBannerVersion: string | null;
  codecPreferences: CodecPreferences;
  headsetEnabled: boolean;
  headsetAutoReconnect: boolean;
  /** Softphone BrowserWindow always-on-top pin (titlebar control; F-016). */
  windowAlwaysOnTop: boolean;
  /** Last successfully connected headset id (`vendorId:productId:productName`). */
  headsetPreferredDeviceId: string | null;
  /** Preferred mic deviceId; null = browser/system default. */
  preferredAudioInputDeviceId: string | null;
  /** Preferred camera deviceId; null = browser/system default. */
  preferredVideoInputDeviceId: string | null;
  /** Session layout applied when a video call connects. */
  defaultSessionView: SessionViewMode;
  /** When true and conference substring matches remote number, open fullscreen. */
  autoFullscreenOnConference: boolean;
  /** Optional remote-number substring for conference auto-fullscreen; null disables match. */
  conferenceNumberSubstring: string | null;
  /** When true, unmute local camera after a video call connects. */
  enableLocalVideoAfterConnect: boolean;
  /** Optional OCP Module integration preferences (token is not stored here). */
  ocpIntegration: OcpIntegrationSettings;
  /** Local SDK WebSocket gateway preferences (no secrets / pairing keys). */
  sdkIntegration: SdkIntegrationSettings;
  /** Profile-scoped outbound HTTP automation definitions. */
  externalServices: ExternalServicesSettings;
  /** Profile-scoped call screen-pop / external application window definitions. */
  externalApplications: ExternalApplicationsSettings;
}>;

export { MIN_SIP_REREGISTER_INTERVAL_SEC, MIN_SIP_RECONNECT_INTERVAL_SEC };

/**
 * - Purpose: default user settings for fresh install.
 * - Inputs: none.
 * - Outputs: validated UserSettings aggregate at current schema version.
 */
export function createDefaultUserSettings(): UserSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    language: DEFAULT_SUPPORTED_LANGUAGE,
    theme: DEFAULT_APP_THEME,
    notificationPreferences: createDefaultUserNotificationPreferences(),
    multiSessionsEnabled: true,
    autoUnholdOnTransferFailure: true,
    autoAnswerTimeoutSec: null,
    autoAnswerDuringActiveSessionEnabled: false,
    ringbackToneEnabled: true,
    incomingRingtoneId: DEFAULT_INCOMING_RINGTONE_ID,
    sipAutoReconnectEnabled: true,
    sipReconnectIntervalSec: DEFAULT_SIP_RECONNECT_INTERVAL_SEC,
    sipReconnectMaxAttempts: DEFAULT_SIP_RECONNECT_MAX_ATTEMPTS,
    sipAutoReregisterEnabled: true,
    sipReregisterIntervalSec: DEFAULT_SIP_REREGISTER_INTERVAL_SEC,
    sipReregisterMaxAttempts: DEFAULT_SIP_REREGISTER_MAX_ATTEMPTS,
    sipAutoRegisterOnStartup: false,
    dismissedUpdateBannerVersion: null,
    codecPreferences: createDefaultCodecPreferences(),
    headsetEnabled: false,
    headsetAutoReconnect: true,
    windowAlwaysOnTop: false,
    headsetPreferredDeviceId: null,
    preferredAudioInputDeviceId: DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID,
    preferredVideoInputDeviceId: DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID,
    defaultSessionView: DEFAULT_DEFAULT_SESSION_VIEW,
    autoFullscreenOnConference: DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE,
    conferenceNumberSubstring: DEFAULT_CONFERENCE_NUMBER_SUBSTRING,
    enableLocalVideoAfterConnect: DEFAULT_ENABLE_LOCAL_VIDEO_AFTER_CONNECT,
    ocpIntegration: OCP_INTEGRATION_DEFAULTS,
    sdkIntegration: SDK_INTEGRATION_DEFAULTS,
    externalServices: EXTERNAL_SERVICES_DEFAULTS,
    externalApplications: EXTERNAL_APPLICATIONS_DEFAULTS,
  };
}
