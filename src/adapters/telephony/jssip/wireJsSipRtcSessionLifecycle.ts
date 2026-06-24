import type { CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { extractPeerConnection } from "./jsSipSessionEventUtils.js";

export type WireJsSipRtcSessionLifecycleOptions = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
  featureId: string;
  session: JsSipRtcSessionPort;
  logger: Logger;
  onPeerConnection: (callId: CallId, connection: unknown) => void;
  onSessionEnded: (callId: CallId, correlationId: CorrelationId) => void;
  onSessionConfirmed?: (callId: CallId, correlationId: CorrelationId) => void;
}>;

/**
 * - Purpose: bind peer connection and terminal session events for one RTC session.
 * - Inputs: call id, correlation id, session port, lifecycle callbacks.
 * - Outputs: wired listeners; invokes callbacks on peer connection and session end.
 */
export function wireJsSipRtcSessionLifecycle(
  options: WireJsSipRtcSessionLifecycleOptions,
): void {
  const {
    callId,
    correlationId,
    featureId,
    session,
    logger,
    onPeerConnection,
    onSessionEnded,
    onSessionConfirmed,
  } = options;

  let ended = false;
  let confirmed = false;

  const handlePeerConnection = (...args: unknown[]): void => {
    const connection = extractPeerConnection(args[0]);
    if (connection === null) {
      return;
    }

    onPeerConnection(callId, connection);
    logger.debug("jssip_session_peer_connection", {
      correlationId,
      featureId,
      boundedContext: "Telephony",
      operation: "jssip_session_peer_connection",
      callId,
    });
  };

  const handleSessionAnswered = (): void => {
    if (confirmed || onSessionConfirmed === undefined) {
      return;
    }
    confirmed = true;
    onSessionConfirmed(callId, correlationId);
  };

  const handleSessionEnd = (): void => {
    if (ended) {
      return;
    }
    ended = true;
    session.off("peerconnection", handlePeerConnection);
    session.off("accepted", handleSessionAnswered);
    session.off("confirmed", handleSessionAnswered);
    session.off("ended", handleEnded);
    session.off("failed", handleFailed);
    onSessionEnded(callId, correlationId);
  };

  const handleEnded = (): void => {
    handleSessionEnd();
  };

  const handleFailed = (): void => {
    handleSessionEnd();
  };

  session.on("peerconnection", handlePeerConnection);
  if (onSessionConfirmed !== undefined) {
    session.on("accepted", handleSessionAnswered);
    session.on("confirmed", handleSessionAnswered);
  }
  session.on("ended", handleEnded);
  session.on("failed", handleFailed);

  const existingConnection = session.getConnection();
  if (existingConnection !== null) {
    onPeerConnection(callId, existingConnection);
  }
}
