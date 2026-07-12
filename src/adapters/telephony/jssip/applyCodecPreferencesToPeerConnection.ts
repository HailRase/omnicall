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
 * - Purpose: apply user codec order via RTCRtpTransceiver.setCodecPreferences.
 * - Inputs: peer connection, resolved MIME lists, logging context, video-mode flag.
 * - Outputs: reordered audio and optional video capabilities; SDP remains fallback.
 */
export function applyCodecPreferencesToPeerConnection(
  connection: unknown,
  resolved: ResolvedEnabledCodecs,
  context: ApplyCodecPreferencesContext,
  includeVideo = false,
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

  applyKindCodecPreferences(
    connection,
    "audio",
    resolved.audioMimeTypes,
    context,
  );
  if (includeVideo) {
    applyKindCodecPreferences(
      connection,
      "video",
      resolved.videoMimeTypes,
      context,
    );
  }
}

function applyKindCodecPreferences(
  connection: RtpPeerConnectionLike,
  kind: "audio" | "video",
  preferredMimeTypes: readonly string[],
  context: ApplyCodecPreferencesContext,
): void {
  const capabilities = RTCRtpReceiver.getCapabilities(kind);
  if (capabilities === null || capabilities.codecs.length === 0) {
    return;
  }

  const orderedCodecs = buildOrderedCodecCapabilities(
    capabilities.codecs,
    preferredMimeTypes,
  );
  if (orderedCodecs.length === 0) {
    return;
  }

  for (const transceiver of connection.getTransceivers()) {
    if (!isMediaKindTransceiver(transceiver, kind)) {
      continue;
    }
    if (typeof transceiver.setCodecPreferences !== "function") {
      continue;
    }
    setTransceiverCodecPreferences(transceiver, orderedCodecs, kind, context);
  }
}

function setTransceiverCodecPreferences(
  transceiver: RtpTransceiverLike,
  codecs: RtpCodecCapability[],
  kind: "audio" | "video",
  context: ApplyCodecPreferencesContext,
): void {
  try {
    transceiver.setCodecPreferences?.(codecs);
  } catch (error: unknown) {
    const normalized = normalizeUnknownError(error);
    context.logger.warn("jssip_set_codec_preferences_failed", {
      correlationId: context.correlationId,
      featureId: context.featureId,
      codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: "jssip_set_codec_preferences",
      mediaKind: kind,
      result: "sdp_munging_fallback",
      errorMessage: normalized.message,
    });
  }
}

function buildOrderedCodecCapabilities(
  browserCodecs: readonly RtpCodecCapability[],
  preferredMimeTypes: readonly string[],
): RtpCodecCapability[] {
  const normalizedPreferences = preferredMimeTypes.map(normalizeMimeType);
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

function isMediaKindTransceiver(
  transceiver: RtpTransceiverLike,
  expectedKind: "audio" | "video",
): boolean {
  if (transceiver.stopped === true) {
    return false;
  }

  const kind =
    transceiver.sender?.track?.kind ?? transceiver.receiver?.track?.kind ?? undefined;

  return kind === expectedKind || (expectedKind === "audio" && kind === undefined);
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
