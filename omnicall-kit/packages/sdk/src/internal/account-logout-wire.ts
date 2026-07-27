/**
 * Account logout wire builder — single-shot `account:logout`.
 */

import { PROTOCOL_MAJOR } from '@softomnitel/omnicall-protocol';

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

export function buildAccountLogoutBody(
  identity: WireIdentity,
  input: {
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }
): string {
  return envelope('account:logout', identity, {
    expectedRevision: input.expectedRevision,
    ...(input.reasonId !== undefined ? { reasonId: input.reasonId } : {})
  });
}
