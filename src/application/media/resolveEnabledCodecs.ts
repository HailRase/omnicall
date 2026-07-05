import {
  AUDIO_CODEC_MIME,
  VIDEO_CODEC_MIME,
  type AudioCodecId,
  type CodecPreferences,
  type VideoCodecId,
} from "@domain/index.js";

export type MediaCodecCapability = Readonly<{
  mimeType: string;
}>;

export type MediaCodecCapabilitySnapshot = Readonly<{
  audio: ReadonlyArray<MediaCodecCapability>;
  video: ReadonlyArray<MediaCodecCapability>;
}>;

export type ResolvedEnabledCodecs = Readonly<{
  audioMimeTypes: ReadonlyArray<string>;
  videoMimeTypes: ReadonlyArray<string>;
}>;

/**
 * - Purpose: map UserSettings codec prefs to ordered enabled WebRTC MIME types.
 * - Inputs: CodecPreferences and optional browser capability snapshot.
 * - Outputs: filtered audio/video MIME lists in user priority order.
 */
export function resolveEnabledCodecs(
  preferences: CodecPreferences,
  capabilities?: MediaCodecCapabilitySnapshot,
): ResolvedEnabledCodecs {
  return {
    audioMimeTypes: resolveKindMimeTypes(
      preferences.audio,
      AUDIO_CODEC_MIME,
      capabilities?.audio,
    ),
    videoMimeTypes: resolveKindMimeTypes(
      preferences.video,
      VIDEO_CODEC_MIME,
      capabilities?.video,
    ),
  };
}

function resolveKindMimeTypes<TId extends AudioCodecId | VideoCodecId>(
  entries: CodecPreferences["audio"] | CodecPreferences["video"],
  mimeById: Readonly<Record<TId, string>>,
  capabilities: ReadonlyArray<MediaCodecCapability> | undefined,
): ReadonlyArray<string> {
  const sorted = [...entries].sort((left, right) => left.order - right.order);
  const enabledMimeTypes = sorted
    .filter((entry) => entry.enabled)
    .map((entry) => mimeById[entry.id as TId]);

  if (capabilities === undefined) {
    return enabledMimeTypes;
  }

  const supportedMimeTypes = new Set(
    capabilities.map((capability) => normalizeMimeType(capability.mimeType)),
  );

  return enabledMimeTypes.filter((mimeType) =>
    supportedMimeTypes.has(normalizeMimeType(mimeType)),
  );
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? mimeType.trim().toLowerCase();
}
