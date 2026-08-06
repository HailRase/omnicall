/**
 * WU-03: latest-known revision tracker transitions (Acceptance §C).
 */

import { describe, expect, it } from 'vitest';

import {
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  createOmniCallClient,
  createRecordingDiagnosticsSink,
  isOmniCallClientError
} from '../index.js';
import {
  buildCallIncomingEvent,
  buildPairingApproved,
  buildPairingPending,
  buildRevokedEvent,
  buildServerHello,
  buildSnapshotMessage,
  findSentType,
  replyCallSuccess,
  replyCommandFailure,
  replyToAuthPing,
  replyToGetSnapshot,
  replyToWindowShow
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function waitFor(
  predicate: () => boolean,
  attempts = 100
): Promise<void> {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) {
      return;
    }
    await flush();
  }
  throw new Error('waitFor timeout');
}

const CAPS = [
  'session.read.redacted',
  'window.show',
  'call.originate',
  'call.hangup'
] as const;

function createHarness() {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const client = createOmniCallClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    requestedProfile: 'call_controller',
    requestedCapabilities: [...CAPS],
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
  return {
    scheduler,
    transports,
    diagnostics,
    keyStore,
    client,
    grantedCapabilities: [...CAPS]
  };
}

async function reachReady(harness: ReturnType<typeof createHarness>): Promise<void> {
  await harness.client.connect();
  harness.transports.last()?.simulateOpen();
  await waitFor(() =>
    Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello'))
  );
  harness.transports.last()!.simulateMessage(
    buildServerHello({ pairingRequired: true })
  );
  await waitFor(() => harness.client.getState() === 'pairing_required');
  await waitFor(() =>
    Boolean(findSentType(harness.transports.last()!, 'pairing:request'))
  );
  const request = findSentType(harness.transports.last()!, 'pairing:request') as {
    clientId: string;
  };
  harness.transports.last()!.simulateMessage(buildPairingPending());
  harness.transports.last()!.simulateMessage(
    buildPairingApproved({
      clientId: request.clientId,
      profile: 'call_controller',
      grantedCapabilities: harness.grantedCapabilities
    })
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
  await waitFor(() => Boolean(findSentType(second, 'sdk:get-snapshot')));
  expect(replyToGetSnapshot(second)).toBe(true);
  await waitFor(() => harness.client.getCachedSnapshot() !== undefined);
}

function buildForeignEpochEvent(sequence: number, revision: number): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'event',
    type: 'call:incoming',
    eventId: `evt_foreign_${sequence}`,
    sequence,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_foreign_999',
    occurredAt: '2026-07-20T09:00:10.000Z',
    revision,
    payload: {
      callId: 'call_foreign_001',
      state: 'ringing',
      direction: 'inbound',
      remoteNumber: '+7***4567'
    }
  });
}

describe('OmniCallClient latest-known revision (WU-03)', () => {
  it('undefined only before first observation', async () => {
    const harness = createHarness();
    expect(harness.client.getRevision()).toBeUndefined();
    await reachReady(harness);
    expect(harness.client.getRevision()).toBe(13);
  });

  it('snapshots update latest-known without lying about cache', async () => {
    const harness = createHarness();
    await reachReady(harness);
    expect(harness.client.getRevision()).toBe(13);
    harness.transports.last()!.simulateMessage(buildSnapshotMessage(25));
    await flush();
    expect(harness.client.getRevision()).toBe(25);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(25);
  });

  it('successful replies update latest-known; cache stays honest', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const showPromise = harness.client.window.show();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'window:show'))
    );
    expect(replyToWindowShow(harness.transports.last()!, 14)).toBe(true);
    await expect(showPromise).resolves.toEqual({ visible: true, revision: 14 });
    expect(harness.client.getRevision()).toBe(14);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(13);
  });

  it('public events update latest-known when greater (monotonic)', async () => {
    const harness = createHarness();
    await reachReady(harness);
    harness.transports.last()!.simulateMessage(buildCallIncomingEvent(1, 20));
    await flush();
    expect(harness.client.getRevision()).toBe(20);
    harness.transports.last()!.simulateMessage(buildCallIncomingEvent(2, 18));
    await flush();
    expect(harness.client.getRevision()).toBe(20);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(13);
  });

  it('stale_state.currentRevision updates tracker and does not auto-replay', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.hangup({
      callId: 'call_stale_rev_001',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:hangup'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'call:hangup', {
        code: 'stale_state',
        retryable: true,
        currentRevision: 21
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) &&
        error.code === 'stale_state' &&
        error.currentRevision === 21
    );
    expect(harness.client.getRevision()).toBe(21);
    expect(
      harness.transports
        .last()!
        .sent.filter((item) => item.includes('"call:hangup"')).length
    ).toBe(1);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(13);
  });

  it('old-session epoch messages do not update tracker', async () => {
    const harness = createHarness();
    await reachReady(harness);
    harness.transports.last()!.simulateMessage(buildForeignEpochEvent(1, 99));
    await flush();
    expect(harness.client.getRevision()).toBe(13);
  });

  it('disconnect clears tracker with snapshot cache', async () => {
    const harness = createHarness();
    await reachReady(harness);
    expect(harness.client.getRevision()).toBe(13);
    harness.client.disconnect();
    expect(harness.client.getRevision()).toBeUndefined();
    expect(harness.client.getCachedSnapshot()).toBeUndefined();
  });

  it('reconnect clears tracker then accepts new-session observations', async () => {
    const harness = createHarness();
    await reachReady(harness);
    harness.transports.last()!.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    expect(harness.client.getRevision()).toBeUndefined();
    expect(harness.client.getCachedSnapshot()).toBeUndefined();
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_reconnect_rev_001',
        nonce: 'cmVjb25uZWN0cmV2MDAx'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(30), 30)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 30);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(30);
  });

  it('revoke clears tracker with snapshot cache', async () => {
    const harness = createHarness();
    await reachReady(harness);
    harness.transports.last()!.simulateMessage(buildRevokedEvent());
    await waitFor(() => harness.client.getState() === 'revoked');
    expect(harness.client.getRevision()).toBeUndefined();
    expect(harness.client.getCachedSnapshot()).toBeUndefined();
  });

  it('successful call reply advances revision without auto-replay', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.originate({
      destination: '+74951234567',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:originate'))
    );
    expect(
      replyCallSuccess(
        harness.transports.last()!,
        'call:originate',
        'call_orig_001',
        15
      )
    ).toBe(true);
    await expect(pending).resolves.toMatchObject({
      callId: 'call_orig_001',
      revision: 15
    });
    expect(harness.client.getRevision()).toBe(15);
    expect(harness.client.getCachedSnapshot()?.revision).toBe(13);
    expect(
      harness.transports
        .last()!
        .sent.filter((item) => item.includes('"call:originate"')).length
    ).toBe(1);
  });
});
