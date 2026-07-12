import {
  DTMF_AUDIO_CODEC_ID,
  VOICE_AUDIO_CODEC_IDS,
  type AudioCodecId,
  type CodecPreferences,
  type VideoCodecId,
} from "@domain/index.js";

/**
 * - Purpose: decide whether audio codec enable checkbox is locked in settings UI.
 * - Inputs: current CodecPreferences and target audio codec id.
 * - Outputs: true when toggle must stay enabled (DTMF or last voice codec).
 */
export function isAudioCodecToggleDisabled(
  preferences: CodecPreferences,
  codecId: AudioCodecId,
): boolean {
  if (codecId === DTMF_AUDIO_CODEC_ID) {
    return true;
  }

  if (!VOICE_AUDIO_CODEC_IDS.some((id) => id === codecId)) {
    return false;
  }

  const entry = preferences.audio.find((row) => row.id === codecId);
  if (entry === undefined || !entry.enabled) {
    return false;
  }

  const otherEnabledVoice = preferences.audio.filter(
    (row) =>
      VOICE_AUDIO_CODEC_IDS.some((id) => id === row.id) &&
      row.id !== codecId &&
      row.enabled,
  );

  return otherEnabledVoice.length === 0;
}

/**
 * - Purpose: decide whether video codec enable checkbox is locked in settings UI.
 * - Inputs: current CodecPreferences and target video codec id.
 * - Outputs: true when codec is the last enabled video codec.
 */
export function isVideoCodecToggleDisabled(
  preferences: CodecPreferences,
  codecId: VideoCodecId,
): boolean {
  const entry = preferences.video.find((row) => row.id === codecId);
  if (entry === undefined || !entry.enabled) {
    return false;
  }

  const otherEnabledVideo = preferences.video.filter(
    (row) => row.id !== codecId && row.enabled,
  );
  return otherEnabledVideo.length === 0;
}
