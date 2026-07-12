/**
 * - Purpose: defaults and parsers for persisted video-call user preferences.
 * - Inputs: unknown device ids and session-view values at settings boundary.
 * - Outputs: typed preference values or null on invalid input.
 */

import {
  DEFAULT_SESSION_VIEW_MODE,
  parseSessionViewMode,
  type SessionViewMode,
} from "../media/SessionViewMode.js";

/** Max length for persisted MediaDeviceInfo.deviceId. */
export const MAX_MEDIA_DEVICE_ID_LENGTH = 256;

/** Max length for optional conference number substring match. */
export const MAX_CONFERENCE_NUMBER_SUBSTRING_LENGTH = 64;

export const DEFAULT_PREFERRED_AUDIO_INPUT_DEVICE_ID: string | null = null;
export const DEFAULT_PREFERRED_VIDEO_INPUT_DEVICE_ID: string | null = null;
export const DEFAULT_DEFAULT_SESSION_VIEW: SessionViewMode = DEFAULT_SESSION_VIEW_MODE;
export const DEFAULT_AUTO_FULLSCREEN_ON_CONFERENCE = false;
export const DEFAULT_CONFERENCE_NUMBER_SUBSTRING: string | null = null;

/**
 * - Purpose: narrow persisted device id to string or null (system default).
 * - Inputs: unknown field value.
 * - Outputs: trimmed id, null, or invalid marker via null + caller error.
 */
export function parsePreferredMediaDeviceId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_MEDIA_DEVICE_ID_LENGTH) {
    return undefined;
  }
  return trimmed;
}

export function parseDefaultSessionViewSetting(value: unknown): SessionViewMode | null {
  return parseSessionViewMode(value);
}

/**
 * - Purpose: narrow optional conference substring used for auto-fullscreen.
 * - Inputs: unknown field value.
 * - Outputs: trimmed substring, null, or undefined when invalid/missing.
 */
export function parseConferenceNumberSubstring(
  value: unknown,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > MAX_CONFERENCE_NUMBER_SUBSTRING_LENGTH) {
    return undefined;
  }
  return trimmed;
}
