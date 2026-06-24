import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";

/**
 * - Purpose: detect adapter port vs raw JsSIP RTCSession at session boundaries.
 * - Inputs: unknown session from newRTCSession or ua.call.
 * - Outputs: type guard for JsSipRtcSessionPort.
 */
export function isJsSipRtcSessionPort(value: unknown): value is JsSipRtcSessionPort {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { getConnection?: unknown };
  return typeof candidate.getConnection === "function";
}

/**
 * - Purpose: normalize raw or port session to JsSipRtcSessionPort.
 * - Inputs: JsSIP RTCSession or existing port (mocks).
 * - Outputs: JsSipRtcSessionPort safe for lifecycle wiring.
 */
export function ensureJsSipRtcSessionPort(
  session: JsSipRtcSessionPort | RTCSession,
): JsSipRtcSessionPort {
  if (isJsSipRtcSessionPort(session)) {
    return session;
  }

  return wrapJsSipRtcSession(session);
}

/**
 * - Purpose: wrap JsSIP RTCSession behind adapter-private port types.
 * - Inputs: JsSIP RTCSession instance.
 * - Outputs: JsSipRtcSessionPort without leaking JsSIP across adapter tests.
 */
export function wrapJsSipRtcSession(session: RTCSession): JsSipRtcSessionPort {
  return {
    id: session.id,
    on: (event, listener) => {
      session.on(event, listener);
    },
    off: (event, listener) => {
      session.off(event, listener);
    },
    answer: (options) => {
      session.answer(options);
    },
    terminate: (options) => {
      session.terminate(options);
    },
    hold: (options, done) => session.hold(options, done),
    unhold: (options, done) => session.unhold(options, done),
    getConnection: () => session.connection ?? null,
    getRemoteIdentityHeader: () => session.remote_identity.toString(),
  };
}
