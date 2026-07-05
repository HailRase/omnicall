import { describe, expect, it } from "vitest";
import { createDefaultCodecPreferences } from "./CodecPreferences.js";
import {
  reorderAudioCodecs,
  reorderVideoCodecs,
  setAudioCodecEnabled,
  setVideoCodecEnabled,
} from "./reorderCodecPreferences.js";

describe("reorderCodecPreferences", () => {
  it("disables a voice codec when another voice codec stays enabled", () => {
    const preferences = createDefaultCodecPreferences();
    const result = setAudioCodecEnabled(preferences, "opus", false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.audio.find((entry) => entry.id === "opus")?.enabled).toBe(false);
    }
  });

  it("blocks disabling the last enabled voice codec", () => {
    const preferences = createDefaultCodecPreferences();
    const onlyPcmuEnabled = {
      ...preferences,
      audio: preferences.audio.map((entry) => ({
        ...entry,
        enabled: entry.id === "pcmu" || entry.id === "telephone-event",
      })),
    };

    const result = setAudioCodecEnabled(onlyPcmuEnabled, "pcmu", false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("last_voice_audio_codec_cannot_disable");
    }
  });

  it("blocks disabling telephone-event", () => {
    const preferences = createDefaultCodecPreferences();
    const result = setAudioCodecEnabled(preferences, "telephone-event", false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("telephone_event_cannot_disable");
    }
  });

  it("reorders audio codecs and reindexes order fields", () => {
    const preferences = createDefaultCodecPreferences();
    const result = reorderAudioCodecs(preferences, 0, 4);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.audio[0]?.id).toBe("pcmu");
      expect(result.value.audio.at(-1)?.id).toBe("opus");
      expect(result.value.audio.map((entry) => entry.order)).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("reorders video codecs", () => {
    const preferences = createDefaultCodecPreferences();
    const result = reorderVideoCodecs(preferences, 0, 2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.video[0]?.id).toBe("vp9");
      expect(result.value.video[2]?.id).toBe("vp8");
    }
  });

  it("toggles video codec enablement", () => {
    const preferences = createDefaultCodecPreferences();
    const result = setVideoCodecEnabled(preferences, "vp8", false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.video.find((entry) => entry.id === "vp8")?.enabled).toBe(false);
    }
  });
});
