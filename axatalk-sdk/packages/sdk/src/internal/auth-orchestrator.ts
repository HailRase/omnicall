/**
 * Pairing + PoP orchestration composed onto ConnectionSession.
 */

import {
  PROTOCOL_MAX,
  PROTOCOL_MIN,
  type ApplicationIdentity,
  type CapabilityId,
  type PairingProfile,
  type ServerHello
} from '@axata/axatalk-protocol';

import { parseGrantedCapabilities } from './auth-grants.js';
import { challengeFromHello, parseInboundAuthMessage } from './auth-inbound.js';
import { completePopAuth, sendPairingRequest } from './auth-pop-flow.js';
import { buildClientHelloBody, isoNow } from './auth-wire.js';
import type { ConnectionSession } from './connection-session.js';
import type { DiagnosticsSink } from './diagnostics.js';
import { generatePopKeyPair } from './pop-crypto.js';
import type { PopKeyStore, StoredPopIdentity } from './pop-key-store.js';
import { sanitizeRequestedCapabilities } from './requested-capabilities.js';
import type { SessionIdentity } from './session-identity.js';
import type { Scheduler } from './scheduler.js';

export type AuthOrchestratorDeps = {
  readonly connection: ConnectionSession;
  readonly origin: string;
  readonly application: ApplicationIdentity;
  readonly sdkVersion: string;
  readonly requestedProfile: PairingProfile;
  readonly requestedCapabilities: readonly CapabilityId[];
  readonly keyStore: PopKeyStore;
  readonly scheduler: Scheduler;
  readonly diagnostics?: DiagnosticsSink;
  readonly onPairingRequired: (info: {
    readonly origin: string;
    readonly requestedProfile: PairingProfile;
    readonly clientId: string | undefined;
  }) => void;
};

export type AuthOrchestrator = {
  readonly getSession: () => SessionIdentity | undefined;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
  readonly preauthDropCount: () => number;
  readonly prepareConnect: () => Promise<void>;
  readonly onHandshaking: () => void;
  readonly onUnhandledMessage: (raw: string) => void;
  readonly clearSession: () => void;
};

export function createAuthOrchestrator(deps: AuthOrchestratorDeps): AuthOrchestrator {
  const usedChallengeIds = new Set<string>();
  let identity: StoredPopIdentity | undefined;
  let session: SessionIdentity | undefined;
  let lastServerInstanceId: string | undefined;
  let identityReady: Promise<void> = Promise.resolve();
  let helloInFlight = false;
  let authInFlight = false;
  let droppedPreauthCount = 0;

  const requestedCapabilities = sanitizeRequestedCapabilities({
    profile: deps.requestedProfile,
    requested: deps.requestedCapabilities
  });

  const prepareConnect = async (): Promise<void> => {
    identityReady = deps.keyStore.load().then((loaded) => {
      identity = loaded;
    });
    await identityReady;
  };

  const sendClientHello = async (): Promise<void> => {
    if (helloInFlight || deps.connection.getState() !== 'handshaking') {
      return;
    }
    helloInFlight = true;
    try {
      await identityReady;
      deps.connection.sendRaw(
        buildClientHelloBody({
          sdkVersion: deps.sdkVersion,
          application: deps.application,
          clientId: identity?.clientId,
          requestedCapabilities,
          occurredAt: isoNow(deps.scheduler.now())
        })
      );
    } finally {
      helloInFlight = false;
    }
  };

  const ensureIdentityKeys = async (): Promise<StoredPopIdentity> => {
    await identityReady;
    if (identity !== undefined) {
      return identity;
    }
    const loaded = await deps.keyStore.load();
    if (loaded !== undefined) {
      identity = loaded;
      return loaded;
    }
    const keys = await generatePopKeyPair();
    const created: StoredPopIdentity = {
      clientId: crypto.randomUUID(),
      publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
      privateKey: keys.privateKey,
      profile: undefined,
      grantedCapabilities: []
    };
    await deps.keyStore.save(created);
    identity = created;
    return created;
  };

  const completeAuth = async (hello: ServerHello): Promise<void> => {
    const challenge = challengeFromHello(hello);
    if (challenge === undefined || authInFlight) {
      if (challenge === undefined) {
        deps.connection.signalFailed();
      }
      return;
    }
    authInFlight = true;
    try {
      const keys = await ensureIdentityKeys();
      const result = await completePopAuth({
        connection: deps.connection,
        origin: deps.origin,
        hello,
        keys,
        scheduler: deps.scheduler,
        usedChallengeIds
      });
      if (!result.ok) {
        deps.connection.signalFailed();
        return;
      }
      session = result.session;
      lastServerInstanceId = hello.serverInstanceId;
      deps.connection.signalReady(hello.heartbeatSeconds);
    } finally {
      authInFlight = false;
    }
  };

  const handleServerHello = async (hello: ServerHello): Promise<void> => {
    if (
      hello.selectedProtocolVersion < PROTOCOL_MIN ||
      hello.selectedProtocolVersion > PROTOCOL_MAX
    ) {
      deps.connection.signalIncompatible();
      return;
    }
    if (
      lastServerInstanceId !== undefined &&
      lastServerInstanceId !== hello.serverInstanceId
    ) {
      usedChallengeIds.clear();
      session = undefined;
    }
    if (hello.pairingRequired) {
      const keys = await ensureIdentityKeys();
      sendPairingRequest({
        connection: deps.connection,
        origin: deps.origin,
        application: deps.application,
        requestedProfile: deps.requestedProfile,
        requestedCapabilities,
        keys,
        scheduler: deps.scheduler,
        onPairingRequired: deps.onPairingRequired
      });
      return;
    }
    await completeAuth(hello);
  };

  const handleInbound = async (raw: string): Promise<void> => {
    const message = parseInboundAuthMessage(raw);
    const state = deps.connection.getState();
    if (message.kind === 'preauth_product') {
      if (state !== 'ready') {
        droppedPreauthCount += 1;
        deps.diagnostics?.emit({
          level: 'warn',
          code: 'auth.preauth_drop',
          connectionState: state
        });
      }
      return;
    }
    if (message.kind === 'incompatible') {
      deps.connection.signalIncompatible();
      return;
    }
    if (message.kind === 'server_hello') {
      await handleServerHello(message.message);
      return;
    }
    if (message.kind === 'pairing_pending') {
      return;
    }
    if (message.kind === 'pairing_approved') {
      const keys = await ensureIdentityKeys();
      const updated: StoredPopIdentity = {
        clientId: message.message.clientId,
        publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
        privateKey: keys.privateKey,
        profile: message.message.profile,
        grantedCapabilities: [...message.message.grantedCapabilities]
      };
      await deps.keyStore.save(updated);
      identity = updated;
      deps.connection.requestReauth();
      return;
    }
    if (message.kind === 'pairing_denied') {
      deps.connection.signalFailed();
      return;
    }
    if (message.kind === 'permission_changed') {
      if (state !== 'ready' || session === undefined || identity === undefined) {
        return;
      }
      const granted = parseGrantedCapabilities(message.grantedCapabilities);
      if (granted === undefined) {
        return;
      }
      identity = { ...identity, grantedCapabilities: granted };
      session = Object.freeze({
        ...session,
        grantedCapabilities: Object.freeze([...granted])
      });
      await deps.keyStore.save(identity);
      return;
    }
    if (message.kind === 'revoked') {
      await deps.keyStore.clear();
      identity = undefined;
      session = undefined;
      usedChallengeIds.clear();
      deps.connection.signalRevoked();
    }
  };

  return {
    getSession: () => session,
    getGrantedCapabilities: () => session?.grantedCapabilities ?? [],
    preauthDropCount: () => droppedPreauthCount,
    prepareConnect,
    onHandshaking: () => {
      void sendClientHello();
    },
    onUnhandledMessage: (raw) => {
      void handleInbound(raw);
    },
    clearSession: () => {
      session = undefined;
    }
  };
}
