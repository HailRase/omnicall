import { describe, expect, it } from "vitest";
import {
  createDefaultCodecPreferences,
  reorderAudioCodecs,
} from "@domain/index.js";
import { resolveEnabledCodecs } from "./resolveEnabledCodecs.js";

describe("resolveEnabledCodecs", () => {
  it("returns enabled audio codecs in user order as MIME types", () => {
    const reordered = reorderAudioCodecs(createDefaultCodecPreferences(), 0, 1);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) {
      throw new Error("expected reorder to succeed");
    }

    const resolved = resolveEnabledCodecs(reordered.value);
    expect(resolved.audioMimeTypes[0]).toBe("audio/PCMU");
    expect(resolved.audioMimeTypes[1]).toBe("audio/opus");
    expect(resolved.audioMimeTypes).toContain("audio/telephone-event");
  });

  it("filters codecs missing from browser capabilities", () => {
    const preferences = createDefaultCodecPreferences();
    const resolved = resolveEnabledCodecs(preferences, {
      audio: [{ mimeType: "audio/PCMU" }, { mimeType: "audio/telephone-event" }],
      video: [],
    });

    expect(resolved.audioMimeTypes).toEqual(["audio/PCMU", "audio/telephone-event"]);
    expect(resolved.videoMimeTypes).toEqual([]);
  });

  it("excludes disabled codecs from resolved MIME lists", () => {
    const preferences = createDefaultCodecPreferences();
    const withOpusDisabled = {
      ...preferences,
      audio: preferences.audio.map((entry) =>
        entry.id === "opus" ? { ...entry, enabled: false } : entry,
      ),
    };

    const resolved = resolveEnabledCodecs(withOpusDisabled);
    expect(resolved.audioMimeTypes).not.toContain("audio/opus");
    expect(resolved.audioMimeTypes[0]).toBe("audio/PCMU");
  });
});
