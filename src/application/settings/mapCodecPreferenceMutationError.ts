import type { CodecPreferenceMutationError } from "@domain/index.js";

export type CodecPreferenceMutationMessageKey =
  | "settings.codecs.errors.telephoneEventRequired"
  | "settings.codecs.errors.lastVoiceCodecRequired"
  | "settings.codecs.errors.unknownAudioCodec"
  | "settings.codecs.errors.unknownVideoCodec"
  | "settings.codecs.errors.reorderFailed";

/**
 * - Purpose: map domain codec mutation errors to renderer translation keys.
 * - Inputs: CodecPreferenceMutationError from reorder/toggle helpers.
 * - Outputs: semantic message key for settings codec panel alerts.
 */
export function mapCodecPreferenceMutationError(
  error: CodecPreferenceMutationError,
): CodecPreferenceMutationMessageKey {
  switch (error) {
    case "telephone_event_cannot_disable":
      return "settings.codecs.errors.telephoneEventRequired";
    case "last_voice_audio_codec_cannot_disable":
      return "settings.codecs.errors.lastVoiceCodecRequired";
    case "unknown_audio_codec_id":
      return "settings.codecs.errors.unknownAudioCodec";
    case "unknown_video_codec_id":
      return "settings.codecs.errors.unknownVideoCodec";
    case "reorder_index_out_of_range":
      return "settings.codecs.errors.reorderFailed";
  }
}
