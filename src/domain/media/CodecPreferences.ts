import type { AudioCodecId, VideoCodecId } from "./CodecId.js";
import {
  AUDIO_CODEC_IDS,
  DTMF_AUDIO_CODEC_ID,
  VIDEO_CODEC_IDS,
} from "./CodecId.js";
import {
  createCodecPreferenceEntry,
  type CodecPreferenceEntry,
} from "./CodecPreferenceEntry.js";

/**
 * - Purpose: persisted audio/video codec order and enablement aggregate.
 * - Inputs: ordered codec entries for each media kind.
 * - Outputs: CodecPreferences value used in UserSettings v3.
 */

export type CodecPreferences = Readonly<{
  audio: ReadonlyArray<CodecPreferenceEntry<AudioCodecId>>;
  video: ReadonlyArray<CodecPreferenceEntry<VideoCodecId>>;
}>;

const DEFAULT_AUDIO_ENABLED: Readonly<Record<AudioCodecId, boolean>> = {
  opus: true,
  pcmu: true,
  pcma: true,
  g722: true,
  "telephone-event": true,
};

const DEFAULT_VIDEO_ENABLED: Readonly<Record<VideoCodecId, boolean>> = {
  vp8: true,
  vp9: true,
  h264: true,
  av1: true,
};

/**
 * - Purpose: factory defaults aligned with SIP/WebRTC interoperability baseline.
 * - Inputs: none.
 * - Outputs: full CodecPreferences with all known codecs present.
 */
export function createDefaultCodecPreferences(): CodecPreferences {
  return {
    audio: AUDIO_CODEC_IDS.map((id, order) =>
      createCodecPreferenceEntry(id, DEFAULT_AUDIO_ENABLED[id], order),
    ),
    video: VIDEO_CODEC_IDS.map((id, order) =>
      createCodecPreferenceEntry(id, DEFAULT_VIDEO_ENABLED[id], order),
    ),
  };
}

/** Voice-bearing audio codecs used for "at least one enabled" rule. */
export const VOICE_AUDIO_CODEC_IDS: readonly AudioCodecId[] = AUDIO_CODEC_IDS.filter(
  (id) => id !== DTMF_AUDIO_CODEC_ID,
);
