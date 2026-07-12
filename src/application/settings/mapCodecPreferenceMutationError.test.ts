import { describe, expect, it } from "vitest";
import { mapCodecPreferenceMutationError } from "./mapCodecPreferenceMutationError.js";

describe("mapCodecPreferenceMutationError", () => {
  it("maps telephone-event guard to translation key", () => {
    expect(mapCodecPreferenceMutationError("telephone_event_cannot_disable")).toBe(
      "settings.codecs.errors.telephoneEventRequired",
    );
  });

  it("maps last voice codec guard to translation key", () => {
    expect(mapCodecPreferenceMutationError("last_voice_audio_codec_cannot_disable")).toBe(
      "settings.codecs.errors.lastVoiceCodecRequired",
    );
  });

  it("maps last video codec guard to translation key", () => {
    expect(mapCodecPreferenceMutationError("last_video_codec_cannot_disable")).toBe(
      "settings.codecs.errors.lastVideoCodecRequired",
    );
  });
});
