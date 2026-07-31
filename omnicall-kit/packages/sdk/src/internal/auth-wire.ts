/**
 * Auth/pairing/handshake wire builders. Schemas from @softomnitel/omnicall-protocol.
 */

import {
  PROTOCOL_MAJOR,
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  type ApplicationIdentity,
  type AuthChallenge,
  type CapabilityId,
  type PairingProfile,
  type ServerHello
} from '@softomnitel/omnicall-protocol';

import { randomBase64Url } from './base64url.js';
import { popKeyAlgorithmId } from './pop-crypto.js';

export function buildClientHelloBody(input: {
  readonly sdkVersion: string;
  readonly application: ApplicationIdentity;
  readonly clientId: string | undefined;
  readonly requestedCapabilities: readonly CapabilityId[];
  readonly occurredAt: string;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'handshake',
    type: 'sdk:client-hello',
    protocolMin: PROTOCOL_MIN,
    protocolMax: PROTOCOL_MAX,
    sdkVersion: input.sdkVersion,
    application: input.application,
    ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
    requestedCapabilities: [...input.requestedCapabilities],
    clientNonce: randomBase64Url(16),
    occurredAt: input.occurredAt
  });
}

export function buildPairingRequestBody(input: {
  readonly clientId: string;
  readonly publicKeySpkiBase64Url: string;
  readonly application: ApplicationIdentity;
  readonly requestedProfile: PairingProfile;
  readonly requestedCapabilities: readonly CapabilityId[];
  readonly occurredAt: string;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'pairing',
    type: 'pairing:request',
    clientId: input.clientId,
    clientPublicKey: input.publicKeySpkiBase64Url,
    keyAlgorithm: popKeyAlgorithmId(),
    application: input.application,
    requestedProfile: input.requestedProfile,
    requestedCapabilities: [...input.requestedCapabilities],
    occurredAt: input.occurredAt
  });
}

export function buildAuthProofBody(input: {
  readonly challengeId: string;
  readonly clientId: string;
  readonly signature: string;
  readonly occurredAt: string;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'auth',
    type: 'sdk:auth-proof',
    challengeId: input.challengeId,
    clientId: input.clientId,
    signature: input.signature,
    occurredAt: input.occurredAt
  });
}

export function buildPingBody(input: {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAt: string;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'sdk:ping',
    requestId: input.requestId,
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    occurredAt: input.occurredAt,
    payload: {}
  });
}

export function isoNow(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

export type NegotiatedServerHello = {
  readonly hello: ServerHello;
  readonly challenge: AuthChallenge | undefined;
};
