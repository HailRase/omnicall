/**
 * - Purpose: call-center tone playback durations for terminal failure tones.
 * - Inputs: tone kind classification for outgoing failure handling.
 * - Outputs: bounded playback milliseconds for busy and failed tones.
 */

export const BUSY_TONE_PLAYBACK_MS = 3_000;
export const FAILED_TONE_PLAYBACK_MS = 2_500;

export type TerminalFailureToneKind = "busy" | "failed";

export function resolveTerminalFailureToneDuration(
  kind: TerminalFailureToneKind,
): number {
  return kind === "busy" ? BUSY_TONE_PLAYBACK_MS : FAILED_TONE_PLAYBACK_MS;
}
