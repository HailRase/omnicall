import { describe, expect, it } from "vitest";
import { createDefaultCodecPreferences } from "./CodecPreferences.js";
import { validateCodecPreferences } from "./validateCodecPreferences.js";

describe("validateCodecPreferences", () => {
  it("accepts default codec preferences", () => {
    const defaults = createDefaultCodecPreferences();
    const result = validateCodecPreferences(defaults);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(defaults);
    }
  });

  it("returns defaults when field is undefined", () => {
    const result = validateCodecPreferences(undefined);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(createDefaultCodecPreferences());
    }
  });

  it("rejects non-object payload", () => {
    expect(validateCodecPreferences(null).ok).toBe(false);
    expect(validateCodecPreferences("x").ok).toBe(false);
  });

  it("rejects missing audio codec ids", () => {
    const result = validateCodecPreferences({
      audio: [{ id: "opus", enabled: true, order: 0 }],
      video: createDefaultCodecPreferences().video,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.includes("count_mismatch"))).toBe(true);
    }
  });

  it("rejects disabling telephone-event", () => {
    const defaults = createDefaultCodecPreferences();
    const result = validateCodecPreferences({
      ...defaults,
      audio: defaults.audio.map((entry) =>
        entry.id === "telephone-event" ? { ...entry, enabled: false } : entry,
      ),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("codecPreferences_telephone_event_must_stay_enabled");
    }
  });

  it("rejects when all voice audio codecs are disabled", () => {
    const defaults = createDefaultCodecPreferences();
    const result = validateCodecPreferences({
      ...defaults,
      audio: defaults.audio.map((entry) =>
        entry.id === "telephone-event" ? entry : { ...entry, enabled: false },
      ),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("codecPreferences_at_least_one_voice_audio_required");
    }
  });

  it("rejects invalid order permutation", () => {
    const defaults = createDefaultCodecPreferences();
    const result = validateCodecPreferences({
      ...defaults,
      audio: defaults.audio.map((entry) =>
        entry.id === "opus" ? { ...entry, order: 99 } : entry,
      ),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("codecPreferences_audio_order_invalid");
    }
  });

  it("normalizes persisted order into sequential indices", () => {
    const defaults = createDefaultCodecPreferences();
    const reorderedAudio = [...defaults.audio]
      .reverse()
      .map((entry, order) => ({ ...entry, order }));

    const result = validateCodecPreferences({
      audio: reorderedAudio,
      video: defaults.video,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.audio[0]?.id).toBe("telephone-event");
      expect(result.value.audio.at(-1)?.id).toBe("opus");
      expect(result.value.audio.map((entry) => entry.order)).toEqual([0, 1, 2, 3, 4]);
    }
  });
});
