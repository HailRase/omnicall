import type { ResolvedEnabledCodecs } from "@application/media/resolveEnabledCodecs.js";
import type { CodecPreferencesPort, Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { resolveJsSipSessionCodecs } from "./resolveJsSipSessionCodecs.js";
import { wireJsSipCodecPreferences } from "./wireJsSipCodecPreferences.js";
import { ensureJsSipRtcSessionPort } from "./wrapJsSipRtcSession.js";

const wiredSessionIds = new Set<string>();
const inFlightBySessionId = new Map<string, Promise<ResolvedEnabledCodecs>>();
const resolvedBySessionId = new Map<string, ResolvedEnabledCodecs>();

export type PrepareJsSipSessionCodecPreferencesOptions = Readonly<{
  session: JsSipRtcSessionPort | RTCSession;
  codecPreferencesPort: CodecPreferencesPort | null;
  logger: Logger;
  correlationId: CorrelationId;
  featureId: string;
  includeVideo?: boolean;
}>;

/**
 * - Purpose: resolve persisted codec prefs and wire before SDP offer/answer.
 * - Inputs: session, codec port, logger metadata, optional video flag.
 * - Outputs: resolved audio/video MIME order; idempotent per session id.
 */
export async function prepareJsSipSessionCodecPreferences(
  options: PrepareJsSipSessionCodecPreferencesOptions,
): Promise<ResolvedEnabledCodecs> {
  const port = ensureJsSipRtcSessionPort(options.session);

  if (wiredSessionIds.has(port.id)) {
    const cached = resolvedBySessionId.get(port.id);
    if (cached !== undefined) {
      return cached;
    }
    return resolveJsSipSessionCodecs(options.codecPreferencesPort, options.logger);
  }

  const inFlight = inFlightBySessionId.get(port.id);
  if (inFlight !== undefined) {
    return inFlight;
  }

  const promise = resolveAndWire(port, options);
  inFlightBySessionId.set(port.id, promise);

  try {
    return await promise;
  } finally {
    inFlightBySessionId.delete(port.id);
  }
}

/**
 * - Purpose: synchronously attach codec listeners when codecs are already resolved.
 * - Inputs: session port, pre-resolved MIME lists, logger metadata.
 * - Outputs: wired listeners without awaiting settings load.
 */
export function wireJsSipSessionCodecPreferencesSync(
  options: Readonly<{
    session: JsSipRtcSessionPort | RTCSession;
    resolved: ResolvedEnabledCodecs;
    logger: Logger;
    correlationId: CorrelationId;
    featureId: string;
    includeVideo?: boolean;
  }>,
): void {
  const port = ensureJsSipRtcSessionPort(options.session);
  if (wiredSessionIds.has(port.id)) {
    return;
  }

  wireJsSipCodecPreferences({
    session: port,
    resolved: options.resolved,
    logger: options.logger,
    correlationId: options.correlationId,
    featureId: options.featureId,
    ...(options.includeVideo === true ? { includeVideo: true } : {}),
  });
  wiredSessionIds.add(port.id);
  resolvedBySessionId.set(port.id, options.resolved);
}

export function isJsSipSessionCodecPreferencesWired(sessionId: string): boolean {
  return wiredSessionIds.has(sessionId);
}

export function clearJsSipSessionCodecPreferencesState(sessionId: string): void {
  wiredSessionIds.delete(sessionId);
  inFlightBySessionId.delete(sessionId);
  resolvedBySessionId.delete(sessionId);
}

/** Test-only: clears module session wiring state between adapter tests. */
export function resetJsSipSessionCodecPreferencesStateForTests(): void {
  wiredSessionIds.clear();
  inFlightBySessionId.clear();
  resolvedBySessionId.clear();
}

async function resolveAndWire(
  port: JsSipRtcSessionPort,
  options: PrepareJsSipSessionCodecPreferencesOptions,
): Promise<ResolvedEnabledCodecs> {
  const resolved = await resolveJsSipSessionCodecs(options.codecPreferencesPort, options.logger);
  wireJsSipSessionCodecPreferencesSync({
    session: port,
    resolved,
    logger: options.logger,
    correlationId: options.correlationId,
    featureId: options.featureId,
    ...(options.includeVideo === true ? { includeVideo: true } : {}),
  });
  return resolved;
}
