/**
 * - Purpose: classify telephony tone streams for priority arbitration.
 * - Inputs: none (closed union).
 * - Outputs: tone kind labels used by the tone playback arbiter.
 */

export const TONE_PLAYBACK_KINDS = [
  "ringtone",
  "ringback",
  "busy",
  "failed",
] as const;

export type TonePlaybackKind = (typeof TONE_PLAYBACK_KINDS)[number];

export function isTonePlaybackKind(value: string): value is TonePlaybackKind {
  return (TONE_PLAYBACK_KINDS as ReadonlyArray<string>).includes(value);
}
