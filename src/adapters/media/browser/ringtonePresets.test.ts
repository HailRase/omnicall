import { describe, expect, it } from "vitest";
import { INCOMING_RINGTONE_IDS } from "@domain/index.js";
import { resolveRingtonePreset } from "./ringtonePresets.js";

describe("ringtonePresets", () => {
  it("defines a synthesis profile for every catalog ringtone id", () => {
    for (const ringtoneId of INCOMING_RINGTONE_IDS) {
      const preset = resolveRingtonePreset(ringtoneId);
      expect(preset.steps.length).toBeGreaterThan(0);
      expect(preset.masterGain).toBeGreaterThan(0);
    }
  });

  it("keeps classic dual-tone cadence unchanged", () => {
    expect(resolveRingtonePreset("classic")).toEqual({
      masterGain: 0.12,
      steps: [
        { frequencyHz: 440, durationMs: 1000, gain: 1 },
        { frequencyHz: 480, durationMs: 1000, gain: 1 },
      ],
    });
  });
});
