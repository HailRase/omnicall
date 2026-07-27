/**
 * Account activate-profile wire builder (SDK-08). Schema-aligned outbound frames.
 */

import { PROTOCOL_MAJOR } from '@softomnitel/omnicall-protocol';

import { isoNow } from './auth-wire.js';

type WireIdentity = {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
};

export function buildAccountActivateProfileBody(
  identity: WireIdentity,
  input: {
    readonly login: string;
    readonly expectedRevision: number;
    readonly mode?: 'sip_only' | 'ocp';
  }
): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'account:activate-profile',
    requestId: identity.requestId,
    serverInstanceId: identity.serverInstanceId,
    sessionEpoch: identity.sessionEpoch,
    occurredAt: isoNow(identity.occurredAtMs),
    payload: {
      login: input.login,
      expectedRevision: input.expectedRevision,
      ...(input.mode === undefined ? {} : { mode: input.mode })
    }
  });
}
