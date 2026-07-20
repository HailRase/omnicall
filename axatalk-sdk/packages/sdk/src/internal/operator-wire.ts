/**
 * Operator command wire builders (SDK-07). Schema-aligned outbound frames.
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

export function buildOperatorGetReasonsBody(identity: WireIdentity): string {
  return envelope('operator:get-reasons', identity, {});
}

export function buildOperatorChangeStatusBody(
  identity: WireIdentity,
  input: {
    readonly target: 'ready' | 'break';
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }
): string {
  return envelope('operator:change-status', identity, {
    target: input.target,
    expectedRevision: input.expectedRevision,
    ...(input.reasonId !== undefined ? { reasonId: input.reasonId } : {})
  });
}
