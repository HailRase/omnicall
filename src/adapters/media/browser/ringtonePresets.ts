import type { IncomingRingtoneId } from "@domain/index.js";

/**
 * - Purpose: WebAudio synthesis profiles for selectable incoming ringtones.
 * - Inputs: IncomingRingtoneId catalog value.
 * - Outputs: oscillator/gain schedule descriptors for tone sessions.
 */

export type RingtoneCadenceStep = Readonly<{
  frequencyHz: number;
  durationMs: number;
  gain: number;
}>;

export type RingtonePreset = Readonly<{
  /** Base gain applied to the master gain node. */
  masterGain: number;
  /** Looping cadence steps; classic preserves 440/480 @ 1000ms. */
  steps: ReadonlyArray<RingtoneCadenceStep>;
}>;

const PRESETS: Readonly<Record<IncomingRingtoneId, RingtonePreset>> = {
  classic: {
    masterGain: 0.12,
    steps: [
      { frequencyHz: 440, durationMs: 1000, gain: 1 },
      { frequencyHz: 480, durationMs: 1000, gain: 1 },
    ],
  },
  "soft-chime": {
    masterGain: 0.09,
    steps: [
      { frequencyHz: 523.25, durationMs: 280, gain: 1 },
      { frequencyHz: 659.25, durationMs: 280, gain: 0.85 },
      { frequencyHz: 783.99, durationMs: 420, gain: 0.7 },
      { frequencyHz: 0, durationMs: 900, gain: 0 },
    ],
  },
  "digital-pulse": {
    masterGain: 0.11,
    steps: [
      { frequencyHz: 880, durationMs: 120, gain: 1 },
      { frequencyHz: 0, durationMs: 120, gain: 0 },
      { frequencyHz: 880, durationMs: 120, gain: 1 },
      { frequencyHz: 0, durationMs: 640, gain: 0 },
    ],
  },
  "marimba-like": {
    masterGain: 0.1,
    steps: [
      { frequencyHz: 392, durationMs: 180, gain: 1 },
      { frequencyHz: 493.88, durationMs: 180, gain: 0.9 },
      { frequencyHz: 587.33, durationMs: 220, gain: 0.8 },
      { frequencyHz: 0, durationMs: 820, gain: 0 },
    ],
  },
  "triad-bell": {
    masterGain: 0.1,
    steps: [
      { frequencyHz: 659.25, durationMs: 200, gain: 1 },
      { frequencyHz: 830.61, durationMs: 200, gain: 0.9 },
      { frequencyHz: 987.77, durationMs: 260, gain: 0.8 },
      { frequencyHz: 0, durationMs: 900, gain: 0 },
    ],
  },
  "office-ring": {
    masterGain: 0.12,
    steps: [
      { frequencyHz: 425, durationMs: 1000, gain: 1 },
      { frequencyHz: 0, durationMs: 4000, gain: 0 },
    ],
  },
  "gentle-pluck": {
    masterGain: 0.08,
    steps: [
      { frequencyHz: 329.63, durationMs: 220, gain: 1 },
      { frequencyHz: 392, durationMs: 260, gain: 0.75 },
      { frequencyHz: 0, durationMs: 1100, gain: 0 },
    ],
  },
  "bright-alert": {
    masterGain: 0.11,
    steps: [
      { frequencyHz: 1200, durationMs: 160, gain: 1 },
      { frequencyHz: 1400, durationMs: 160, gain: 1 },
      { frequencyHz: 0, durationMs: 480, gain: 0 },
    ],
  },
  "warm-bells": {
    masterGain: 0.09,
    steps: [
      { frequencyHz: 466.16, durationMs: 320, gain: 1 },
      { frequencyHz: 554.37, durationMs: 320, gain: 0.85 },
      { frequencyHz: 698.46, durationMs: 400, gain: 0.7 },
      { frequencyHz: 0, durationMs: 960, gain: 0 },
    ],
  },
  "minimal-beep": {
    masterGain: 0.1,
    steps: [
      { frequencyHz: 800, durationMs: 140, gain: 1 },
      { frequencyHz: 0, durationMs: 1860, gain: 0 },
    ],
  },
  "night-soft": {
    masterGain: 0.05,
    steps: [
      { frequencyHz: 349.23, durationMs: 500, gain: 1 },
      { frequencyHz: 415.3, durationMs: 500, gain: 0.8 },
      { frequencyHz: 0, durationMs: 1400, gain: 0 },
    ],
  },
  "crystal-tone": {
    masterGain: 0.09,
    steps: [
      { frequencyHz: 1046.5, durationMs: 180, gain: 1 },
      { frequencyHz: 1318.5, durationMs: 180, gain: 0.85 },
      { frequencyHz: 1567.98, durationMs: 220, gain: 0.7 },
      { frequencyHz: 0, durationMs: 900, gain: 0 },
    ],
  },
};

/**
 * - Purpose: resolve synthesis profile for a ringtone id.
 * - Inputs: IncomingRingtoneId.
 * - Outputs: RingtonePreset (classic when id missing from map — defensive).
 */
export function resolveRingtonePreset(ringtoneId: IncomingRingtoneId): RingtonePreset {
  return PRESETS[ringtoneId] ?? PRESETS.classic;
}
