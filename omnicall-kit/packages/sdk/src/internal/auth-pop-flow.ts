/**
 * Pairing request + PoP challenge completion helpers for AuthOrchestrator.
 */

import type {
  ApplicationIdentity,
  CapabilityId,
  PairingProfile,
  ServerHello
} from '@softomnitel/omnicall-protocol';

import {
  buildAuthProofBody,
  buildPairingRequestBody,
  buildPingBody,
  isoNow
} from './auth-wire.js';
import { challengeFromHello } from './auth-inbound.js';
import type { ConnectionSession } from './connection-session.js';
import { signPopChallenge } from './pop-crypto.js';
import type { StoredPopIdentity } from './pop-key-store.js';
import type { SessionIdentity } from './session-identity.js';
import type { Scheduler } from './scheduler.js';

export function sendPairingRequest(input: {
  readonly connection: ConnectionSession;
  readonly origin: string;
  readonly application: ApplicationIdentity;
  readonly requestedProfile: PairingProfile;
  readonly requestedCapabilities: readonly CapabilityId[];
  readonly keys: StoredPopIdentity;
  readonly scheduler: Scheduler;
  readonly onPairingRequired: (info: {
    readonly origin: string;
    readonly requestedProfile: PairingProfile;
    readonly clientId: string | undefined;
  }) => void;
}): void {
  input.connection.signalPairingRequired();
  input.onPairingRequired({
    origin: input.origin,
    requestedProfile: input.requestedProfile,
    clientId: input.keys.clientId
  });
  input.connection.sendRaw(
    buildPairingRequestBody({
      clientId: input.keys.clientId,
      publicKeySpkiBase64Url: input.keys.publicKeySpkiBase64Url,
      application: input.application,
      requestedProfile: input.requestedProfile,
      requestedCapabilities: input.requestedCapabilities,
      occurredAt: isoNow(input.scheduler.now())
    })
  );
}

export type CompletePopAuthResult =
  | { readonly ok: true; readonly session: SessionIdentity }
  | { readonly ok: false; readonly reason: 'no_challenge' | 'replay' | 'ping_failed' };

export async function completePopAuth(input: {
  readonly connection: ConnectionSession;
  readonly origin: string;
  readonly hello: ServerHello;
  readonly keys: StoredPopIdentity;
  readonly scheduler: Scheduler;
  readonly usedChallengeIds: Set<string>;
}): Promise<CompletePopAuthResult> {
  const challenge = challengeFromHello(input.hello);
  if (challenge === undefined) {
    return { ok: false, reason: 'no_challenge' };
  }
  if (input.usedChallengeIds.has(challenge.challengeId)) {
    return { ok: false, reason: 'replay' };
  }
  input.usedChallengeIds.add(challenge.challengeId);
  input.connection.signalAuthenticating();
  const signature = await signPopChallenge({
    privateKey: input.keys.privateKey,
    serverInstanceId: input.hello.serverInstanceId,
    sessionEpoch: input.hello.sessionEpoch,
    origin: input.origin,
    clientId: input.keys.clientId,
    challengeId: challenge.challengeId,
    nonce: challenge.nonce
  });
  input.connection.sendRaw(
    buildAuthProofBody({
      challengeId: challenge.challengeId,
      clientId: input.keys.clientId,
      signature,
      occurredAt: isoNow(input.scheduler.now())
    })
  );
  input.connection.setWireIdentity({
    serverInstanceId: input.hello.serverInstanceId,
    sessionEpoch: input.hello.sessionEpoch
  });
  const requestId = `auth_ping_${input.scheduler.now()}`;
  const pingResult = await input.connection.request({
    requestId,
    commandType: 'sdk:ping',
    body: buildPingBody({
      requestId,
      serverInstanceId: input.hello.serverInstanceId,
      sessionEpoch: input.hello.sessionEpoch,
      occurredAt: isoNow(input.scheduler.now())
    })
  });
  if (!pingResult.ok) {
    return { ok: false, reason: 'ping_failed' };
  }
  return {
    ok: true,
    session: Object.freeze({
      serverInstanceId: input.hello.serverInstanceId,
      sessionEpoch: input.hello.sessionEpoch,
      selectedProtocolVersion: input.hello.selectedProtocolVersion,
      clientId: input.keys.clientId,
      profile: input.keys.profile,
      grantedCapabilities: Object.freeze([...input.keys.grantedCapabilities]),
      heartbeatSeconds: input.hello.heartbeatSeconds,
      maxMessageBytes: input.hello.maxMessageBytes
    })
  };
}
