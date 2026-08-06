/**
 * Origin trust / blacklist client error mapping (ADR-0018).
 */

import type { WireJsonObject } from '@softomnitel/omnicall-protocol';

import {
  createClientError,
  isOmniCallClientError
} from './client-errors.js';
import type { OmniCallClientError } from './client-errors.js';
import type { ConnectionState } from './connection-state.js';
import type { TransportCloseInfo } from './transport-port.js';

/** Wire / details key for first-contact Origin Deny. @public */
export const ORIGIN_DENIED_DETAIL_KEY = 'origin_denied' as const;

const ORIGIN_POLICY_TRANSPORT_CLOSE_CODES = new Set([4003, 4403]);

/** @public */
export function createOriginBlockedError(): OmniCallClientError {
  return createClientError({ code: 'origin_blocked', retryable: false });
}

export function createOriginDeniedError(): OmniCallClientError {
  return createClientError({
    code: 'forbidden',
    retryable: false,
    details: { [ORIGIN_DENIED_DETAIL_KEY]: true }
  });
}

export function isOriginDeniedWireDetails(
  details: WireJsonObject | undefined
): boolean {
  if (details === undefined) {
    return false;
  }
  if (details[ORIGIN_DENIED_DETAIL_KEY] === true) {
    return true;
  }
  return details['reason'] === ORIGIN_DENIED_DETAIL_KEY;
}

/**
 * True for upgrade reject (`origin_blocked`: not allowed / blacklisted) and
 * residual wire deny (`forbidden` + `origin_denied` details).
 * @public
 */
export function isOriginBlockedError(value: unknown): value is OmniCallClientError {
  if (!isOmniCallClientError(value)) {
    return false;
  }
  if (value.code === 'origin_blocked') {
    return true;
  }
  return value.code === 'forbidden' && isOriginDeniedWireDetails(value.details);
}

export function isOriginPolicyTransportReject(
  closeInfo: TransportCloseInfo
): boolean {
  const reason = closeInfo.reason.trim().toLowerCase();
  if (reason.length === 0) {
    return ORIGIN_POLICY_TRANSPORT_CLOSE_CODES.has(closeInfo.code);
  }
  return (
    reason.includes(ORIGIN_DENIED_DETAIL_KEY) ||
    reason.includes('origin_blocked') ||
    reason.includes('origin_policy')
  );
}

export function mapTransportCloseToOriginPolicyError(
  closeInfo: TransportCloseInfo,
  connectionState: ConnectionState
): OmniCallClientError | undefined {
  if (connectionState === 'connecting') {
    if (isOriginPolicyTransportReject(closeInfo)) {
      return createOriginBlockedError();
    }
    return undefined;
  }
  if (
    connectionState === 'handshaking' ||
    connectionState === 'pairing_required' ||
    connectionState === 'authenticating'
  ) {
    if (isOriginPolicyTransportReject(closeInfo)) {
      return createOriginDeniedError();
    }
  }
  return undefined;
}
