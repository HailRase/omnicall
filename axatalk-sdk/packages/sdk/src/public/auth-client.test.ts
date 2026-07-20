import { describe, expect, it } from 'vitest';

import {
  createAuthClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  createRecordingDiagnosticsSink
} from '../index.js';
import {
  buildPairingApproved,
  buildPairingDenied,
  buildPairingPending,
  buildPermissionChanged,
  buildRevokedEvent,
  buildServerHello,
  buildSnapshotMessage,
  findSentType,
  replyToAuthPing
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';
import { generatePopKeyPair } from '../internal/pop-crypto.js';
import { sanitizeRequestedCapabilities } from '../internal/requested-capabilities.js';

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function waitFor(
  predicate: () => boolean,
  attempts = 80
): Promise<void> {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) {
      return;
    }
    await flush();
  }
  throw new Error('waitFor timeout');
}

function createHarness(input?: {
  readonly requestedCapabilities?: readonly (
    | 'session.read.redacted'
    | 'window.show'
    | 'account.activate'
    | 'window.hide'
    | 'call.control'
  )[];
}) {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const client = createAuthClient({
    url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-test',
    requestedProfile: 'presentation',
    requestedCapabilities: input?.requestedCapabilities ?? [
      'session.read.redacted',
      'window.show'
    ],
    keyStore,
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    diagnostics,
    defaultRequestTimeoutMs: 500,
    reconnect: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1_000,
      jitterRatio: 0
    },
    heartbeat: { enabled: false, intervalMs: 1_000, timeoutMs: 200 }
  });
  return { scheduler, transports, diagnostics, keyStore, client };
}

async function reachReadyViaPairing(
  harness: ReturnType<typeof createHarness>
): Promise<string> {
  const pairingRequired: string[] = [];
  harness.client.onPairingRequired(() => {
    pairingRequired.push('yes');
  });
  await harness.client.connect();
  harness.transports.last()?.simulateOpen();
  await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello')));
  harness.transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
  await waitFor(() => harness.client.getState() === 'pairing_required');
  expect(pairingRequired).toEqual(['yes']);
  await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'pairing:request')));
  const request = findSentType(harness.transports.last()!, 'pairing:request') as {
    clientId: string;
    requestedCapabilities: string[];
  };
  harness.transports.last()!.simulateMessage(buildPairingPending());
  harness.transports.last()!.simulateMessage(
    buildPairingApproved({ clientId: request.clientId })
  );
  await waitFor(() => harness.client.getState() === 'reconnecting');
  harness.scheduler.advanceBy(100);
  await waitFor(() => harness.client.getState() === 'connecting');
  const second = harness.transports.last()!;
  second.simulateOpen();
  await waitFor(() => Boolean(findSentType(second, 'sdk:client-hello')));
  second.simulateMessage(buildServerHello({ pairingRequired: false }));
  await waitFor(() => Boolean(findSentType(second, 'sdk:auth-proof')));
  await waitFor(() => replyToAuthPing(second));
  await waitFor(() => harness.client.getState() === 'ready');
  return request.clientId;
}

describe('auth client pairing and PoP', () => {
  it('pairs, authenticates, and projects server grants', async () => {
    const harness = createHarness();
    const clientId = await reachReadyViaPairing(harness);
    expect(harness.client.getGrantedCapabilities()).toEqual([
      'session.read.redacted',
      'window.show'
    ]);
    expect(harness.client.getSession()?.clientId).toBe(clientId);
    const stored = harness.keyStore.peek();
    expect(stored?.clientId).toBe(clientId);
    expect(stored?.grantedCapabilities).toEqual([
      'session.read.redacted',
      'window.show'
    ]);
  });

  it('notifies pairing_required and fails closed on denial', async () => {
    const harness = createHarness();
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello')));
    harness.transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
    await waitFor(() => harness.client.getState() === 'pairing_required');
    const request = findSentType(harness.transports.last()!, 'pairing:request') as {
      clientId: string;
    };
    harness.transports.last()!.simulateMessage(buildPairingDenied(request.clientId));
    await waitFor(() => harness.client.getState() === 'failed');
  });

  it('re-auths from stored identity without pairing', async () => {
    const keys = await generatePopKeyPair();
    const keyStore = createMemoryPopKeyStore({
      clientId: 'client_stored_001',
      publicKeySpkiBase64Url: keys.publicKeySpkiBase64Url,
      privateKey: keys.privateKey,
      profile: 'presentation',
      grantedCapabilities: ['session.read.redacted', 'window.show']
    });
    const scheduler = createFakeScheduler(1_700_000_000_000);
    const transports = createFakeTransportController();
    const client = createAuthClient({
      url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
      origin: 'https://crm.example',
      application: { name: 'fixture-crm', version: '1.0.0' },
      sdkVersion: '0.0.0-test',
      requestedProfile: 'presentation',
      keyStore,
      transportFactory: transports.create,
      scheduler,
      jitter: createFixedJitterSource(0.5),
      defaultRequestTimeoutMs: 500
    });
    await client.connect();
    transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(transports.last()!, 'sdk:client-hello')));
    const hello = findSentType(transports.last()!, 'sdk:client-hello') as {
      clientId?: string;
    };
    expect(hello.clientId).toBe('client_stored_001');
    transports.last()!.simulateMessage(buildServerHello({ pairingRequired: false }));
    await waitFor(() => Boolean(findSentType(transports.last()!, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(transports.last()!));
    await waitFor(() => client.getState() === 'ready');
    expect(client.getGrantedCapabilities()).toEqual([
      'session.read.redacted',
      'window.show'
    ]);
  });
});

describe('auth hostile matrix', () => {
  it('enters incompatible on unsupported selected protocol', async () => {
    const harness = createHarness();
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello')));
    harness.transports.last()!.simulateMessage(
      buildServerHello({ pairingRequired: false, selectedProtocolVersion: 99 })
    );
    await waitFor(() => harness.client.getState() === 'incompatible');
  });

  it('drops pre-auth snapshot/events and never becomes ready from them', async () => {
    const harness = createHarness();
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello')));
    harness.transports.last()!.simulateMessage(buildSnapshotMessage());
    await flush();
    expect(harness.client.preauthDropCount()).toBeGreaterThan(0);
    expect(harness.client.getState()).toBe('handshaking');
    expect(harness.client.getGrantedCapabilities()).toEqual([]);
  });

  it('refuses product surface before ready', async () => {
    const harness = createHarness();
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    expect(harness.client.getState()).not.toBe('ready');
    expect(harness.client.getGrantedCapabilities()).toEqual([]);
    expect(harness.client.getSession()).toBeUndefined();
    expect(harness.client).not.toHaveProperty('getSnapshot');
  });

  it('fails closed on challengeId replay after reconnect (same instance)', async () => {
    const harness = createHarness();
    await reachReadyViaPairing(harness);
    harness.transports.last()!.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_test_001',
        serverInstanceId: 'srv_test_001'
      })
    );
    await waitFor(() => harness.client.getState() === 'failed');
  });

  it('clears session grants on stale serverInstanceId before re-auth', async () => {
    const harness = createHarness();
    await reachReadyViaPairing(harness);
    expect(harness.client.getGrantedCapabilities().length).toBeGreaterThan(0);
    harness.transports.last()!.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    expect(harness.client.getGrantedCapabilities()).toEqual([]);
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_stale_001',
        serverInstanceId: 'srv_test_stale',
        sessionEpoch: 'epoch_stale_001'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    expect(harness.client.getSession()?.serverInstanceId).toBe('srv_test_stale');
  });

  it('revokes, clears key store, and stays terminal', async () => {
    const harness = createHarness();
    await reachReadyViaPairing(harness);
    harness.transports.last()!.simulateMessage(buildRevokedEvent());
    await waitFor(() => harness.client.getState() === 'revoked');
    expect(harness.keyStore.peek()).toBeUndefined();
    expect(harness.client.getGrantedCapabilities()).toEqual([]);
  });

  it('updates capability projection from server permission-changed only', async () => {
    const harness = createHarness();
    await reachReadyViaPairing(harness);
    harness.transports.last()!.simulateMessage(
      buildPermissionChanged(['session.read.redacted'])
    );
    await waitFor(() => harness.client.getGrantedCapabilities().length === 1);
    expect(harness.client.getGrantedCapabilities()).toEqual(['session.read.redacted']);
  });

  it('strips privileged capabilities from pairing requests', async () => {
    const sanitized = sanitizeRequestedCapabilities({
      profile: 'presentation',
      requested: ['session.read.redacted', 'account.activate', 'window.hide', 'call.control']
    });
    expect(sanitized).toEqual(['session.read.redacted']);
    expect(sanitized).not.toContain('account.activate');
    expect(sanitized).not.toContain('window.hide');

    const harness = createHarness({
      requestedCapabilities: [
        'session.read.redacted',
        'window.show',
        'account.activate',
        'window.hide'
      ]
    });
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello')));
    harness.transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
    await waitFor(() => Boolean(findSentType(harness.transports.last()!, 'pairing:request')));
    const request = findSentType(harness.transports.last()!, 'pairing:request') as {
      requestedCapabilities: string[];
    };
    expect(request.requestedCapabilities).not.toContain('account.activate');
    expect(request.requestedCapabilities).not.toContain('window.hide');
  });

  it('keeps diagnostics free of nonce/signature/phone needles', async () => {
    const harness = createHarness();
    await reachReadyViaPairing(harness);
    const serialized = JSON.stringify(harness.diagnostics.events);
    expect(serialized).not.toContain('Y2hhbGxlbmdlbm9uY2U');
    expect(serialized).not.toContain('+15551234567');
    expect(serialized).not.toContain('super-secret-token');
    for (const event of harness.diagnostics.events) {
      expect(event).not.toHaveProperty('nonce');
      expect(event).not.toHaveProperty('signature');
      expect(event).not.toHaveProperty('payload');
    }
  });
});
