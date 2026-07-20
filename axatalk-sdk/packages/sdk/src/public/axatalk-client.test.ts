import { describe, expect, it } from 'vitest';

import {
  createAxatalkClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  createRecordingDiagnosticsSink,
  isAxatalkClientError
} from '../index.js';
import {
  buildCallIncomingEvent,
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  buildSnapshotMessage,
  buildWindowVisibilityEvent,
  findSentType,
  replyToAuthPing,
  replyToGetSnapshot,
  replyToGetSnapshotReplyOnly,
  replyToGetSnapshotWithMismatch,
  replyToWindowGetStateMalformed,
  replyToWindowShow
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';

function countGetSnapshotSends(transport: {
  readonly sent: readonly string[];
}): number {
  return transport.sent.filter((item) =>
    item.includes('"sdk:get-snapshot"')
  ).length;
}

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

function createHarness(input?: {
  readonly requestedCapabilities?: readonly (
    | 'session.read.redacted'
    | 'window.show'
    | 'call.control'
  )[];
}) {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const client = createAxatalkClient({
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
  await waitFor(() => Boolean(findSentType(second, 'sdk:get-snapshot')));
  expect(replyToGetSnapshot(second)).toBe(true);
  await waitFor(() => harness.client.getCachedSnapshot() !== undefined);
}

describe('AxatalkClient constructor', () => {
  it('has no connect/pair/auth/snapshot side effects', () => {
    const harness = createHarness();
    expect(harness.client.getState()).toBe('idle');
    expect(harness.transports.last()).toBeUndefined();
    expect(harness.client.getCachedSnapshot()).toBeUndefined();
    expect(harness.client).not.toHaveProperty('originate');
    expect(harness.client).not.toHaveProperty('hide');
    expect(harness.client.window).not.toHaveProperty('hide');
  });
});

describe('AxatalkClient snapshot and events', () => {
  it('connects, caches snapshot, and supports typed subscribe/unsubscribe', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const snapshot = harness.client.getCachedSnapshot();
    expect(snapshot?.revision).toBe(13);
    expect(snapshot?.sections.calls).toEqual([]);
    const remote = snapshot?.sections.calls?.[0]?.remoteNumber;
    expect(remote === undefined || remote.includes('*')).toBe(true);

    const seen: string[] = [];
    const unsubscribe = harness.client.subscribe('call:incoming', (event) => {
      seen.push(event.type);
      expect(event.payload.remoteNumber).toMatch(/\*/);
    });
    harness.transports.last()!.simulateMessage(buildCallIncomingEvent(1));
    await flush();
    expect(seen).toEqual(['call:incoming']);
    unsubscribe();
    harness.transports.last()!.simulateMessage(buildCallIncomingEvent(2));
    await flush();
    expect(seen).toEqual(['call:incoming']);
  });

  it('fails closed on getSnapshot before ready', async () => {
    const harness = createHarness();
    await harness.client.connect();
    await expect(harness.client.getSnapshot()).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
  });

  it('resyncs on sequence gap', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    transport.simulateMessage(buildCallIncomingEvent(1));
    await flush();
    transport.simulateMessage(buildCallIncomingEvent(3));
    await waitFor(() =>
      harness.diagnostics.events.some((event) => event.code === 'event.sequence_gap')
    );
    await waitFor(() => {
      const snapshots = transport.sent.filter((item) =>
        item.includes('"sdk:get-snapshot"')
      );
      return snapshots.length >= 2;
    });
    expect(replyToGetSnapshot(transport, buildSnapshotMessage(20), 20)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 20);
  });

  it('replaces snapshot cache after reconnect', async () => {
    const harness = createHarness();
    await reachReady(harness);
    expect(harness.client.getRevision()).toBe(13);
    harness.transports.last()!.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    expect(harness.client.getCachedSnapshot()).toBeUndefined();
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_reconnect_001',
        nonce: 'cmVjb25uZWN0bm9uY2U'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(30), 30)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 30);
  });

  it('resolves getSnapshot with DI-05 order for a fresh revision', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const before = countGetSnapshotSends(transport);
    const pending = harness.client.getSnapshot();
    await waitFor(() => countGetSnapshotSends(transport) > before);
    expect(
      replyToGetSnapshot(transport, buildSnapshotMessage(21), 21)
    ).toBe(true);
    await expect(pending).resolves.toMatchObject({ revision: 21 });
    expect(harness.client.getRevision()).toBe(21);
  });

  it('rejects in-flight getSnapshot on disconnect after reply-only', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const before = countGetSnapshotSends(transport);
    const pending = harness.client.getSnapshot();
    await waitFor(() => countGetSnapshotSends(transport) > before);
    expect(replyToGetSnapshotReplyOnly(transport, 99)).toBe(true);
    await flush();
    expect(harness.client.getRevision()).toBe(13);
    harness.client.disconnect();
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
  });

  it('does not resolve stale cache when reply revision mismatches', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const before = countGetSnapshotSends(transport);
    const pending = harness.client.getSnapshot();
    await waitFor(() => countGetSnapshotSends(transport) > before);
    expect(replyToGetSnapshotWithMismatch(transport, 13, 99)).toBe(true);
    await flush();
    expect(harness.client.getRevision()).toBe(13);
    harness.scheduler.advanceBy(500);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'timeout'
    );
    expect(harness.client.getRevision()).toBe(13);
  });

  it('resolves when matching snapshot arrives after reply-only', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const before = countGetSnapshotSends(transport);
    const pending = harness.client.getSnapshot();
    await waitFor(() => countGetSnapshotSends(transport) > before);
    expect(replyToGetSnapshotReplyOnly(transport, 42)).toBe(true);
    await flush();
    transport.simulateMessage(buildSnapshotMessage(42));
    await expect(pending).resolves.toMatchObject({ revision: 42 });
    expect(harness.client.getRevision()).toBe(42);
  });
});

describe('AxatalkClient window.show', () => {
  it('requires window.show capability and emits visibility path', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const visibility: boolean[] = [];
    harness.client.subscribe('window:visibility-changed', (event) => {
      visibility.push(event.payload.visible);
    });
    const showPromise = harness.client.window.show();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'window:show'))
    );
    expect(replyToWindowShow(harness.transports.last()!)).toBe(true);
    harness.transports.last()!.simulateMessage(
      buildWindowVisibilityEvent(2, true, 14)
    );
    await expect(showPromise).resolves.toEqual({ visible: true, revision: 14 });
    await flush();
    expect(visibility).toEqual([true]);
  });

  it('fails closed on window.show before ready', async () => {
    const harness = createHarness();
    await harness.client.connect();
    await expect(harness.client.window.show()).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
  });

  it('fails closed when window getState visible is not boolean', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.window.getState();
    await waitFor(() => Boolean(findSentType(transport, 'window:get-state')));
    expect(replyToWindowGetStateMalformed(transport)).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'invalid_payload'
    );
  });

  it('returns forbidden without window.show grant', async () => {
    const harness = createHarness({
      requestedCapabilities: ['session.read.redacted']
    });
    await harness.client.connect();
    harness.transports.last()?.simulateOpen();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'sdk:client-hello'))
    );
    harness.transports.last()!.simulateMessage(
      buildServerHello({ pairingRequired: true })
    );
    await waitFor(() => harness.client.getState() === 'pairing_required');
    const request = findSentType(
      harness.transports.last()!,
      'pairing:request'
    ) as { clientId: string };
    harness.transports.last()!.simulateMessage(buildPairingPending());
    harness.transports.last()!.simulateMessage(
      buildPairingApproved({
        clientId: request.clientId,
        grantedCapabilities: ['session.read.redacted']
      })
    );
    await waitFor(() => harness.client.getState() === 'reconnecting');
    harness.scheduler.advanceBy(100);
    const second = harness.transports.last()!;
    second.simulateOpen();
    await waitFor(() => Boolean(findSentType(second, 'sdk:client-hello')));
    second.simulateMessage(buildServerHello({ pairingRequired: false }));
    await waitFor(() => Boolean(findSentType(second, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(second));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(second, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(second)).toBe(true);
    await expect(harness.client.window.show()).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'forbidden'
    );
  });
});
