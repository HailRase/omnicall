/**
 * - Purpose: canonical audio and video codec identifiers for user preferences.
 * - Inputs: known codec id strings at settings boundaries.
 * - Outputs: typed AudioCodecId, VideoCodecId, and WebRTC MIME mappings.
 */

export const AUDIO_CODEC_IDS = [
  "opus",
  "pcmu",
  "pcma",
  "g722",
  "telephone-event",
] as const;

export type AudioCodecId = (typeof AUDIO_CODEC_IDS)[number];

export const VIDEO_CODEC_IDS = ["h264", "vp8", "vp9", "av1"] as const;

export type VideoCodecId = (typeof VIDEO_CODEC_IDS)[number];

export type MediaCodecId = AudioCodecId | VideoCodecId;

/** DTMF payload — must stay enabled for F-008. */
export const DTMF_AUDIO_CODEC_ID: AudioCodecId = "telephone-event";

export const AUDIO_CODEC_MIME: Readonly<Record<AudioCodecId, string>> = {
  opus: "audio/opus",
  pcmu: "audio/PCMU",
  pcma: "audio/PCMA",
  g722: "audio/G722",
  "telephone-event": "audio/telephone-event",
};

export const VIDEO_CODEC_MIME: Readonly<Record<VideoCodecId, string>> = {
  vp8: "video/VP8",
  vp9: "video/VP9",
  h264: "video/H264",
  av1: "video/AV1",
};

export function isAudioCodecId(value: string): value is AudioCodecId {
  return (AUDIO_CODEC_IDS as readonly string[]).includes(value);
}

export function isVideoCodecId(value: string): value is VideoCodecId {
  return (VIDEO_CODEC_IDS as readonly string[]).includes(value);
}

export function parseAudioCodecId(value: unknown): AudioCodecId | null {
  return typeof value === "string" && isAudioCodecId(value) ? value : null;
}

export function parseVideoCodecId(value: unknown): VideoCodecId | null {
  return typeof value === "string" && isVideoCodecId(value) ? value : null;
}
