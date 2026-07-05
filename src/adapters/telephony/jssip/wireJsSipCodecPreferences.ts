import type { ResolvedEnabledCodecs } from "@application/media/resolveEnabledCodecs.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

import {
  applyCodecPreferencesToPeerConnection,
  type ApplyCodecPreferencesContext,
} from "./applyCodecPreferencesToPeerConnection.js";
import { extractPeerConnection } from "./jsSipSessionEventUtils.js";
import { logNegotiatedAudioCodecs } from "./logNegotiatedAudioCodecs.js";
import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { mungeSdpCodecOrder } from "./mungeSdpCodecOrder.js";

const FEATURE_ID_CODEC_PREFERENCES = "F-022";

export type WireJsSipCodecPreferencesOptions = Readonly<{
  session: JsSipRtcSessionPort;
  resolved: ResolvedEnabledCodecs;
  logger: Logger;
  correlationId: CorrelationId;
  featureId: string;
}>;

type LocalSdpEvent = Readonly<{
  originator: string;
  sdp: string;
}>;

/**
 * - Purpose: dual-layer audio codec apply (setCodecPreferences + local SDP munging) per session.
 * - Inputs: JsSIP session port, resolved audio MIME lists, logger metadata.
 * - Outputs: wired sdp/peerconnection/confirmed listeners for the RTC session lifetime.
 */
export function wireJsSipCodecPreferences(options: WireJsSipCodecPreferencesOptions): void {
  const { session, resolved, logger, correlationId, featureId } = options;
  const applyContext: ApplyCodecPreferencesContext = { logger, correlationId, featureId };

  const handlePeerConnection = (...args: unknown[]): void => {
    const connection = extractPeerConnection(args[0]);
    if (connection === null) {
      return;
    }

    applyCodecPreferencesToPeerConnection(connection, resolved, applyContext);
    logger.debug("jssip_codec_preferences_peer_connection_applied", {
      correlationId,
      featureId,
      codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: "jssip_codec_preferences_peer_connection_applied",
      audioCodecs: resolved.audioMimeTypes.join(","),
    });
  };

  const handleSdp = (...args: unknown[]): void => {
    const event = extractLocalSdpEvent(args[0]);
    if (event === null) {
      return;
    }

    const mungedSdp = mungeSdpCodecOrder(event.sdp, resolved.audioMimeTypes);
    if (mungedSdp === event.sdp) {
      return;
    }

    mutateLocalSdp(event, mungedSdp);
    logger.debug("jssip_codec_preferences_sdp_munged", {
      correlationId,
      featureId,
      codecFeatureId: FEATURE_ID_CODEC_PREFERENCES,
      boundedContext: "Media",
      operation: "jssip_codec_preferences_sdp_munged",
      audioCodecs: resolved.audioMimeTypes.join(","),
    });
  };

  const handleNegotiatedCodecsDiagnostics = (): void => {
    const connection = session.getConnection();
    if (connection === null) {
      return;
    }

    void logNegotiatedAudioCodecs(connection, logger, {
      correlationId,
      featureId,
      operation: "jssip_negotiated_audio_codecs",
    });
  };

  session.on("peerconnection", handlePeerConnection);
  session.on("sdp", handleSdp);
  session.on("confirmed", handleNegotiatedCodecsDiagnostics);
  session.on("accepted", handleNegotiatedCodecsDiagnostics);

  const existingConnection = session.getConnection();
  if (existingConnection !== null) {
    applyCodecPreferencesToPeerConnection(existingConnection, resolved, applyContext);
  }
}

function extractLocalSdpEvent(event: unknown): LocalSdpEvent | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }

  const candidate = event as { originator?: unknown; sdp?: unknown };
  if (candidate.originator !== "local" || typeof candidate.sdp !== "string") {
    return null;
  }

  return candidate as LocalSdpEvent;
}

function mutateLocalSdp(event: LocalSdpEvent, sdp: string): void {
  (event as { sdp: string }).sdp = sdp;
}
