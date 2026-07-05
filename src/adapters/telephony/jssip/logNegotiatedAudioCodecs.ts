import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { normalizeUnknownError } from "@shared/errors/index.js";

const FEATURE_ID_CODEC_PREFERENCES = "F-022";

type NegotiatedAudioCodecSnapshot = Readonly<{
  localMime: string | undefined;
  remoteMime: string | undefined;
  localPayloadType: number | undefined;
  remotePayloadType: number | undefined;
}>;

type RtcStatsReport = Readonly<{
  type?: string;
  kind?: string;
  mimeType?: string;
  payloadType?: number;
}>;

type RtcStatsPeerConnectionLike = Readonly<{
  getStats: () => Promise<ReadonlyMap<string, RtcStatsReport>>;
}>;

export type LogNegotiatedAudioCodecsContext = Readonly<{
  correlationId: CorrelationId;
  featureId: string;
  operation: string;
}>;

/**
 * - Purpose: best-effort negotiated audio codec diagnostics via WebRTC stats.
 * - Inputs: peer connection, logger, correlation metadata.
 * - Outputs: structured info log; warning on stats failure without throwing.
 */
export async function logNegotiatedAudioCodecs(
  connection: unknown,
  logger: Logger,
  context: LogNegotiatedAudioCodecsContext,
): Promise<void> {
  if (!isRtcStatsPeerConnectionLike(connection)) {
    return;
  }

  try {
    const stats = await connection.getStats();
    const negotiated = extractNegotiatedAudioCodecs(stats);

    if (negotiated.localMime === undefined && negotiated.remoteMime === undefined) {
      logger.debug("jssip_negotiated_codecs_unavailable", {
        correlationId: context.correlationId,
        featureId: context.featureId,
        codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
        boundedContext: "Media",
        operation: context.operation,
        result: "no_audio_codec_stats",
      });
      return;
    }

    logger.info("jssip_negotiated_audio_codecs", {
      correlationId: context.correlationId,
      featureId: context.featureId,
      codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: context.operation,
      result: "negotiated",
      localAudioMime: negotiated.localMime,
      remoteAudioMime: negotiated.remoteMime,
      localPayloadType: negotiated.localPayloadType,
      remotePayloadType: negotiated.remotePayloadType,
    });
  } catch (error: unknown) {
    const normalized = normalizeUnknownError(error);
    logger.warn("jssip_negotiated_codecs_stats_failed", {
      correlationId: context.correlationId,
      featureId: context.featureId,
      codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: context.operation,
      result: "stats_unavailable",
      errorMessage: normalized.message,
    });
  }
}

function extractNegotiatedAudioCodecs(
  stats: ReadonlyMap<string, RtcStatsReport>,
): NegotiatedAudioCodecSnapshot {
  let localMime: string | undefined;
  let remoteMime: string | undefined;
  let localPayloadType: number | undefined;
  let remotePayloadType: number | undefined;

  for (const report of stats.values()) {
    if (report.kind !== "audio") {
      continue;
    }

    if (report.type === "outbound-rtp" && localMime === undefined) {
      localMime = report.mimeType;
      localPayloadType = report.payloadType;
      continue;
    }

    if (report.type === "inbound-rtp" && remoteMime === undefined) {
      remoteMime = report.mimeType;
      remotePayloadType = report.payloadType;
    }
  }

  return { localMime, remoteMime, localPayloadType, remotePayloadType };
}

function isRtcStatsPeerConnectionLike(value: unknown): value is RtcStatsPeerConnectionLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { getStats?: unknown }).getStats === "function";
}
