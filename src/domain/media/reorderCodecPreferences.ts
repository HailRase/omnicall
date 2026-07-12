import { DTMF_AUDIO_CODEC_ID, type AudioCodecId, type VideoCodecId } from "./CodecId.js";
import type { CodecPreferenceEntry } from "./CodecPreferenceEntry.js";
import {
  VOICE_AUDIO_CODEC_IDS,
  type CodecPreferences,
} from "./CodecPreferences.js";

export type CodecPreferenceMutationError =
  | "unknown_audio_codec_id"
  | "unknown_video_codec_id"
  | "telephone_event_cannot_disable"
  | "last_voice_audio_codec_cannot_disable"
  | "last_video_codec_cannot_disable"
  | "reorder_index_out_of_range";

export type CodecPreferenceMutationResult =
  | Readonly<{ ok: true; value: CodecPreferences }>
  | Readonly<{ ok: false; error: CodecPreferenceMutationError }>;

/**
 * - Purpose: pure toggles and reorder helpers for settings UI wiring.
 * - Inputs: current CodecPreferences, target codec id, enabled flag or indices.
 * - Outputs: updated preferences or deterministic mutation error.
 */

export function setAudioCodecEnabled(
  preferences: CodecPreferences,
  codecId: AudioCodecId,
  enabled: boolean,
): CodecPreferenceMutationResult {
  if (!preferences.audio.some((entry) => entry.id === codecId)) {
    return { ok: false, error: "unknown_audio_codec_id" };
  }

  if (codecId === DTMF_AUDIO_CODEC_ID && !enabled) {
    return { ok: false, error: "telephone_event_cannot_disable" };
  }

  if (!enabled && isVoiceAudioCodecId(codecId)) {
    const otherEnabledVoice = preferences.audio.filter(
      (entry) => isVoiceAudioCodecId(entry.id) && entry.id !== codecId && entry.enabled,
    );
    if (otherEnabledVoice.length === 0) {
      return { ok: false, error: "last_voice_audio_codec_cannot_disable" };
    }
  }

  return {
    ok: true,
    value: {
      ...preferences,
      audio: preferences.audio.map((entry) =>
        entry.id === codecId ? { ...entry, enabled } : entry,
      ),
    },
  };
}

export function setVideoCodecEnabled(
  preferences: CodecPreferences,
  codecId: VideoCodecId,
  enabled: boolean,
): CodecPreferenceMutationResult {
  if (!preferences.video.some((entry) => entry.id === codecId)) {
    return { ok: false, error: "unknown_video_codec_id" };
  }

  if (!enabled) {
    const otherEnabledVideo = preferences.video.filter(
      (entry) => entry.id !== codecId && entry.enabled,
    );
    if (otherEnabledVideo.length === 0) {
      return { ok: false, error: "last_video_codec_cannot_disable" };
    }
  }

  return {
    ok: true,
    value: {
      ...preferences,
      video: preferences.video.map((entry) =>
        entry.id === codecId ? { ...entry, enabled } : entry,
      ),
    },
  };
}

export function reorderAudioCodecs(
  preferences: CodecPreferences,
  fromIndex: number,
  toIndex: number,
): CodecPreferenceMutationResult {
  return reorderCodecList(preferences.audio, (audio) => ({ ...preferences, audio }), fromIndex, toIndex);
}

export function reorderVideoCodecs(
  preferences: CodecPreferences,
  fromIndex: number,
  toIndex: number,
): CodecPreferenceMutationResult {
  return reorderCodecList(preferences.video, (video) => ({ ...preferences, video }), fromIndex, toIndex);
}

function reorderCodecList<TId extends string>(
  entries: ReadonlyArray<CodecPreferenceEntry<TId>>,
  apply: (reordered: ReadonlyArray<CodecPreferenceEntry<TId>>) => CodecPreferences,
  fromIndex: number,
  toIndex: number,
): CodecPreferenceMutationResult {
  const mutableEntries = [...entries];

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= mutableEntries.length ||
    toIndex >= mutableEntries.length
  ) {
    return { ok: false, error: "reorder_index_out_of_range" };
  }

  if (fromIndex === toIndex) {
    return { ok: true, value: apply(entries) };
  }

  const [moved] = mutableEntries.splice(fromIndex, 1);
  if (moved === undefined) {
    return { ok: false, error: "reorder_index_out_of_range" };
  }

  mutableEntries.splice(toIndex, 0, moved);

  const reordered = mutableEntries.map((entry, order) => ({
    ...entry,
    order,
  }));

  return {
    ok: true,
    value: apply(reordered),
  };
}

function isVoiceAudioCodecId(codecId: AudioCodecId): boolean {
  return VOICE_AUDIO_CODEC_IDS.some((id) => id === codecId);
}
