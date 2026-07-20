import {
  PROTOCOL_DEPRECATION_MIN_DAYS,
  PROTOCOL_DEPRECATION_MIN_DESKTOP_MINORS,
  PROTOCOL_MAJOR
} from './constants.js';
import type { ProtocolVersion } from './primitives.js';

/** @public */
export type ProtocolNegotiationSuccess = {
  readonly ok: true;
  readonly selectedVersion: ProtocolVersion;
};

/** @public */
export type ProtocolNegotiationFailure = {
  readonly ok: false;
  readonly code: 'incompatible_version';
  readonly clientRange: readonly [ProtocolVersion, ProtocolVersion];
  readonly serverRange: readonly [ProtocolVersion, ProtocolVersion];
};

/** @public */
export type ProtocolNegotiationResult =
  | ProtocolNegotiationSuccess
  | ProtocolNegotiationFailure;

/**
 * Select the highest mutually supported protocol major.
 * @public
 */
export function negotiateProtocolVersion(
  clientMin: ProtocolVersion,
  clientMax: ProtocolVersion,
  serverMin: ProtocolVersion,
  serverMax: ProtocolVersion
): ProtocolNegotiationResult {
  if (clientMin > clientMax || serverMin > serverMax) {
    return {
      ok: false,
      code: 'incompatible_version',
      clientRange: [clientMin, clientMax],
      serverRange: [serverMin, serverMax]
    };
  }
  const low = Math.max(clientMin, serverMin);
  const high = Math.min(clientMax, serverMax);
  if (low > high) {
    return {
      ok: false,
      code: 'incompatible_version',
      clientRange: [clientMin, clientMax],
      serverRange: [serverMin, serverMax]
    };
  }
  return { ok: true, selectedVersion: high };
}

/**
 * True when the peer major cannot interoperate with this package's authored range.
 * @public
 */
export function isIncompatibleProtocolVersion(
  peerMin: ProtocolVersion,
  peerMax: ProtocolVersion,
  localMin: ProtocolVersion = PROTOCOL_MAJOR,
  localMax: ProtocolVersion = PROTOCOL_MAJOR
): boolean {
  return !negotiateProtocolVersion(peerMin, peerMax, localMin, localMax).ok;
}

/**
 * ADR-0017: after major N+1 ships, major N stays until both ≥90 days and
 * ≥2 desktop minors have elapsed (the longer constraint wins).
 * @public
 */
export function isProtocolMajorDropAllowed(parts: {
  readonly daysSinceSuccessorPublished: number;
  readonly desktopMinorsSinceSuccessorPublished: number;
}): boolean {
  return (
    parts.daysSinceSuccessorPublished >= PROTOCOL_DEPRECATION_MIN_DAYS &&
    parts.desktopMinorsSinceSuccessorPublished >=
      PROTOCOL_DEPRECATION_MIN_DESKTOP_MINORS
  );
}
