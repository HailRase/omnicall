/**
 * Call mutation wire builders (SDK-06). Schema-aligned outbound frames.
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

export function buildCallOriginateBody(
  identity: WireIdentity,
  input: { readonly destination: string; readonly expectedRevision: number }
): string {
  return envelope('call:originate', identity, {
    destination: input.destination,
    expectedRevision: input.expectedRevision
  });
}

export function buildCallControlBody(
  type:
    | 'call:answer'
    | 'call:reject'
    | 'call:hangup'
    | 'call:hold'
    | 'call:resume'
    | 'call:mute'
    | 'call:unmute',
  identity: WireIdentity,
  input: { readonly callId: string; readonly expectedRevision: number }
): string {
  return envelope(type, identity, {
    callId: input.callId,
    expectedRevision: input.expectedRevision
  });
}

export function buildCallSendDtmfBody(
  identity: WireIdentity,
  input: {
    readonly callId: string;
    readonly digits: string;
    readonly expectedRevision: number;
  }
): string {
  return envelope('call:send-dtmf', identity, {
    callId: input.callId,
    digits: input.digits,
    expectedRevision: input.expectedRevision
  });
}
