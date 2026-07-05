import type { ResolvedEnabledCodecs } from "@application/media/resolveEnabledCodecs.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";

type RtpCodecCapability = Readonly<{
  mimeType: string;
  clockRate?: number;
  channels?: number;
  sdpFmtpLine?: string;
}>;

type RtpTransceiverLike = Readonly<{
  stopped?: boolean;
  setCodecPreferences?: (codecs: RtpCodecCapability[]) => void;
  sender?: Readonly<{ track?: Readonly<{ kind?: string }> | null }>;
  receiver?: Readonly<{ track?: Readonly<{ kind?: string }> | null }>;
}>;

type RtpPeerConnectionLike = Readonly<{
  getTransceivers: () => RtpTransceiverLike[];
}>;

const FEATURE_ID_CODEC_PREFERENCES = "F-022";
const AUXILIARY_CODEC_TOKENS = ["rtx", "red", "ulpfec", "fec"] as const;

export type ApplyCodecPreferencesContext = Readonly<{
  logger: Logger;
  correlationId: CorrelationId;
  featureId: string;
}>;

/**
 * - Purpose: apply user audio codec order on RTCPeerConnection via setCodecPreferences.
 * - Inputs: peer connection, resolved enabled audio MIME lists, logging context.
 * - Outputs: reordered audio capabilities on audio transceivers; SDP munging remains fallback.
 */
export function applyCodecPreferencesToPeerConnection(
  connection: unknown,
  resolved: ResolvedEnabledCodecs,
  context: ApplyCodecPreferencesContext,
): void {
  if (!isRtpPeerConnectionLike(connection)) {
    return;
  }

  if (typeof RTCRtpReceiver === "undefined") {
    return;
  }

  if (typeof RTCRtpReceiver.getCapabilities !== "function") {
    return;
  }

  const audioCapabilities = RTCRtpReceiver.getCapabilities("audio");
  if (audioCapabilities === null || audioCapabilities.codecs.length === 0) {
    return;
  }

  const orderedAudioCodecs = buildOrderedAudioCodecCapabilities(
    audioCapabilities.codecs,
    resolved.audioMimeTypes,
  );

  if (orderedAudioCodecs.length === 0) {
    return;
  }

  for (const transceiver of connection.getTransceivers()) {
    if (!isAudioTransceiver(transceiver)) {
      continue;
    }
    if (typeof transceiver.setCodecPreferences !== "function") {
      continue;
    }

    try {
      transceiver.setCodecPreferences(orderedAudioCodecs);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      context.logger.warn("jssip_set_codec_preferences_failed", {
        correlationId: context.correlationId,
        featureId: context.featureId,
        codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
        boundedContext: "Media",
        operation: "jssip_set_codec_preferences",
        result: "sdp_munging_fallback",
        errorMessage: normalized.message,
      });
    }
  }
}

function buildOrderedAudioCodecCapabilities(
  browserCodecs: readonly RtpCodecCapability[],
  preferredAudioMimeTypes: readonly string[],
): RtpCodecCapability[] {
  const normalizedPreferences = preferredAudioMimeTypes.map(normalizeMimeType);
  const usedIndices = new Set<number>();
  const ordered: RtpCodecCapability[] = [];

  for (const preferredMime of normalizedPreferences) {
    for (let index = 0; index < browserCodecs.length; index += 1) {
      if (usedIndices.has(index)) {
        continue;
      }
      const codec = browserCodecs[index];
      if (codec === undefined) {
        continue;
      }
      if (normalizeMimeType(codec.mimeType) !== preferredMime) {
        continue;
      }
      ordered.push(codec);
      usedIndices.add(index);
    }
  }

  for (let index = 0; index < browserCodecs.length; index += 1) {
    if (usedIndices.has(index)) {
      continue;
    }
    const codec = browserCodecs[index];
    if (codec === undefined) {
      continue;
    }
    if (isAuxiliaryMimeType(normalizeMimeType(codec.mimeType))) {
      ordered.push(codec);
      usedIndices.add(index);
    }
  }

  return ordered;
}

function isAudioTransceiver(transceiver: RtpTransceiverLike): boolean {
  if (transceiver.stopped === true) {
    return false;
  }

  const kind =
    transceiver.sender?.track?.kind ?? transceiver.receiver?.track?.kind ?? undefined;

  if (kind === "video") {
    return false;
  }

  return kind === "audio" || kind === undefined;
}

function isAuxiliaryMimeType(mimeType: string): boolean {
  if (mimeType === "audio/telephone-event") {
    return true;
  }
  return AUXILIARY_CODEC_TOKENS.some((token) => mimeType.includes(token));
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? mimeType.trim().toLowerCase();
}

function isRtpPeerConnectionLike(value: unknown): value is RtpPeerConnectionLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { getTransceivers?: unknown }).getTransceivers === "function";
}
