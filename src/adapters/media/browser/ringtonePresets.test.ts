import { describe, expect, it } from "vitest";
import { INCOMING_RINGTONE_IDS } from "@domain/index.js";
import { CLASSIC_RING_SEQUENCE_MS } from "./classicRingtone.js";
import { resolveRingtonePreset } from "./ringtonePresets.js";

describe("ringtonePresets", () => {
  it("defines a synthesis profile for every catalog ringtone id", () => {
    for (const ringtoneId of INCOMING_RINGTONE_IDS) {
      const preset = resolveRingtonePreset(ringtoneId);
      expect(preset.steps.length).toBeGreaterThan(0);
      expect(preset.masterGain).toBeGreaterThan(0);
    }
  });

  it("documents classic FM ring cadence metadata", () => {
    expect(resolveRingtonePreset("classic")).toEqual({
      masterGain: 0.5,
      steps: [
        { frequencyHz: 660, durationMs: CLASSIC_RING_SEQUENCE_MS[0], gain: 1 },
        { frequencyHz: 0, durationMs: CLASSIC_RING_SEQUENCE_MS[1], gain: 0 },
        { frequencyHz: 660, durationMs: CLASSIC_RING_SEQUENCE_MS[2], gain: 1 },
        { frequencyHz: 0, durationMs: CLASSIC_RING_SEQUENCE_MS[3], gain: 0 },
      ],
    });
  });

  it("keeps original soft-chime catalog values", () => {
    expect(resolveRingtonePreset("soft-chime")).toEqual({
      masterGain: 0.09,
      steps: [
        { frequencyHz: 523.25, durationMs: 280, gain: 1 },
        { frequencyHz: 659.25, durationMs: 280, gain: 0.85 },
        { frequencyHz: 783.99, durationMs: 420, gain: 0.7 },
        { frequencyHz: 0, durationMs: 900, gain: 0 },
      ],
    });
  });
});
