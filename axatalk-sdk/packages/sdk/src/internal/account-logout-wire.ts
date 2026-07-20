/**
 * Account logout wire builders (SDK-07). Schema-aligned outbound frames.
 */

import { PROTOCOL_MAJOR } from '@axatalk/protocol';

import { isoNow } from './auth-wire.js';

type WireIdentity = {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
};

function envelope(
  type: string,
  identity: WireIdentity,
  payload: Readonly<Record<string, unknown>>
): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type,
    requestId: identity.requestId,
    serverInstanceId: identity.serverInstanceId,
    sessionEpoch: identity.sessionEpoch,
    occurredAt: isoNow(identity.occurredAtMs),
    payload
  });
}

export function buildAccountPrepareLogoutBody(
  identity: WireIdentity,
  input: { readonly expectedRevision: number }
): string {
  return envelope('account:prepare-logout', identity, {
    expectedRevision: input.expectedRevision
  });
}

export function buildAccountConfirmLogoutBody(
  identity: WireIdentity,
  input: {
    readonly logoutToken: string;
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }
): string {
  return envelope('account:confirm-logout', identity, {
    logoutToken: input.logoutToken,
    expectedRevision: input.expectedRevision,
    ...(input.reasonId !== undefined ? { reasonId: input.reasonId } : {})
  });
}
