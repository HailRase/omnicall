import type { CallId } from "@domain/index.js";
import type { Logger } from "@ports/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { extractPeerConnection, isRemoteOriginatedSessionEvent } from "./jsSipSessionEventUtils.js";

export type WireJsSipRtcSessionLifecycleOptions = Readonly<{
  callId: CallId;
  correlationId: CorrelationId;
  featureId: string;
  session: JsSipRtcSessionPort;
  logger: Logger;
  onPeerConnection: (callId: CallId, connection: unknown) => void;
  onSessionEnded: (callId: CallId, correlationId: CorrelationId) => void;
  onSessionConfirmed?: (callId: CallId, correlationId: CorrelationId) => void;
  onRemoteHold?: (callId: CallId, correlationId: CorrelationId) => void;
  onRemoteResume?: (callId: CallId, correlationId: CorrelationId) => void;
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
    onRemoteHold,
    onRemoteResume,
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
    session.off("hold", handleHold);
    session.off("unhold", handleUnhold);
    onSessionEnded(callId, correlationId);
  };

  const handleHold = (...args: unknown[]): void => {
    if (onRemoteHold === undefined || !isRemoteOriginatedSessionEvent(args[0])) {
      return;
    }
    onRemoteHold(callId, correlationId);
  };

  const handleUnhold = (...args: unknown[]): void => {
    if (onRemoteResume === undefined || !isRemoteOriginatedSessionEvent(args[0])) {
      return;
    }
    onRemoteResume(callId, correlationId);
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
  if (onRemoteHold !== undefined) {
    session.on("hold", handleHold);
  }
  if (onRemoteResume !== undefined) {
    session.on("unhold", handleUnhold);
  }

  const existingConnection = session.getConnection();
  if (existingConnection !== null) {
    onPeerConnection(callId, existingConnection);
  }
}
