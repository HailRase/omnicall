import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";

import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";

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
