/**
 * - Purpose: stable catalog of selectable incoming ringtone presets.
 * - Inputs: unknown persisted id strings.
 * - Outputs: validated IncomingRingtoneId or default classic.
 */

export const INCOMING_RINGTONE_IDS = [
  "classic",
  "soft-chime",
  "digital-pulse",
  "marimba-like",
  "triad-bell",
  "office-ring",
  "gentle-pluck",
  "bright-alert",
  "warm-bells",
  "minimal-beep",
  "night-soft",
  "crystal-tone",
] as const;

export type IncomingRingtoneId = (typeof INCOMING_RINGTONE_IDS)[number];

export const DEFAULT_INCOMING_RINGTONE_ID: IncomingRingtoneId = "classic";

const INCOMING_RINGTONE_ID_SET: ReadonlySet<string> = new Set(INCOMING_RINGTONE_IDS);

/**
 * - Purpose: narrow unknown ringtone id to catalog value.
 * - Inputs: unknown persisted or UI value.
 * - Outputs: IncomingRingtoneId when recognized; otherwise null.
 */
export function parseIncomingRingtoneId(value: unknown): IncomingRingtoneId | null {
  if (typeof value !== "string") {
    return null;
  }
  if (!INCOMING_RINGTONE_ID_SET.has(value)) {
    return null;
  }
  return value as IncomingRingtoneId;
}

/**
 * - Purpose: resolve ringtone id with classic fallback for missing/unknown values.
 * - Inputs: unknown persisted value.
 * - Outputs: catalog IncomingRingtoneId (never throws).
 */
export function resolveIncomingRingtoneId(value: unknown): IncomingRingtoneId {
  return parseIncomingRingtoneId(value) ?? DEFAULT_INCOMING_RINGTONE_ID;
}

/**
 * - Purpose: expose catalog order for Settings UI and tests.
 * - Inputs: none.
 * - Outputs: readonly list of IncomingRingtoneId values.
 */
export function listIncomingRingtoneIds(): ReadonlyArray<IncomingRingtoneId> {
  return INCOMING_RINGTONE_IDS;
}
