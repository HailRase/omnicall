import type { ReferOptions } from "@hailrase/jssip/lib/RTCSession.js";
import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";

import type {
  JsSipReferCommandOptions,
  JsSipRtcSessionEventName,
  JsSipRtcSessionListener,
  JsSipRtcSessionPort,
} from "./JsSipRtcSessionPort.js";

const rawRtcSessionByPort = new WeakMap<object, RTCSession>();

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
  const port: JsSipRtcSessionPort = {
    id: session.id,
    on: (event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener) => {
      session.on(event, listener);
    },
    off: (event: JsSipRtcSessionEventName, listener: JsSipRtcSessionListener) => {
      session.off(event, listener);
    },
    answer: (options?: Readonly<Record<string, unknown>>) => {
      session.answer(options);
    },
    terminate: (options?: Readonly<Record<string, unknown>>) => {
      session.terminate(options);
    },
    hold: (options?: Readonly<Record<string, unknown>>, done?: () => void) =>
      session.hold(options, done),
    unhold: (options?: Readonly<Record<string, unknown>>, done?: () => void) =>
      session.unhold(options, done),
    refer: (target: string, options?: JsSipReferCommandOptions) => {
      const referOptions = mapReferOptions(options);
      return session.refer(target, referOptions);
    },
    sendDtmf: (tone: string, options?: Readonly<Record<string, unknown>>) => {
      session.sendDTMF(tone, options);
    },
    getConnection: () => session.connection ?? null,
    getRemoteIdentityHeader: () => session.remote_identity.toString(),
  };
  rawRtcSessionByPort.set(port, session);
  return port;
}

/**
 * - Purpose: resolve raw JsSIP RTCSession for attended REFER Replaces header.
 * - Inputs: stored session snapshot from adapter registry.
 * - Outputs: RTCSession with dialog tags or null when dialog is unavailable.
 */
export function resolveReplacesRtcSession(stored: unknown): RTCSession | null {
  if (isJsSipReplacesRtcSession(stored)) {
    return stored;
  }

  if (typeof stored === "object" && stored !== null) {
    const mapped = rawRtcSessionByPort.get(stored);
    if (mapped !== undefined && isJsSipReplacesRtcSession(mapped)) {
      return mapped;
    }
  }

  return null;
}

/**
 * - Purpose: pick REFER replaces target for real JsSIP or adapter test ports.
 * - Inputs: stored consultation session from adapter registry.
 * - Outputs: replaces session object or null when unavailable.
 */
export function resolveReplacesForRefer(
  stored: unknown,
): RTCSession | JsSipRtcSessionPort | null {
  const rawSession = resolveReplacesRtcSession(stored);
  if (rawSession !== null) {
    return rawSession;
  }

  if (isJsSipRtcSessionPort(stored)) {
    return stored;
  }

  return null;
}

/**
 * - Purpose: store best replaces snapshot at session registration time.
 * - Inputs: raw or port session passed into adapter registration.
 * - Outputs: raw RTCSession reference or original session for later REFER.
 */
export function resolveReplacesStorageTarget(
  session: JsSipRtcSessionPort | RTCSession,
): unknown {
  const port = ensureJsSipRtcSessionPort(session);
  return resolveReplacesRtcSession(session) ?? resolveReplacesRtcSession(port) ?? session;
}

function isJsSipReplacesRtcSession(value: unknown): value is RTCSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as {
    _request?: { call_id?: unknown };
    _to_tag?: unknown;
    _from_tag?: unknown;
  };

  return (
    session._request !== undefined &&
    typeof session._request.call_id === "string" &&
    typeof session._to_tag === "string" &&
    typeof session._from_tag === "string"
  );
}

function mapReferOptions(
  options?: Readonly<{
    eventHandlers?: Readonly<Record<string, (...args: unknown[]) => void>>;
    replaces?: unknown;
    extraHeaders?: readonly string[];
  }>,
): ReferOptions | undefined {
  if (options === undefined) {
    return undefined;
  }

  const mapped: ReferOptions = {};
  if (options.eventHandlers !== undefined) {
    mapped.eventHandlers = options.eventHandlers;
  }
  if (options.extraHeaders !== undefined) {
    mapped.extraHeaders = [...options.extraHeaders];
  }
  if (options.replaces !== undefined) {
    mapped.replaces = options.replaces as RTCSession;
  }
  return mapped;
}
