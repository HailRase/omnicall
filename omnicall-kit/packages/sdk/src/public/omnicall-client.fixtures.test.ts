import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  createOmniCallClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  isOmniCallClientError,
  PUBLIC_EVENT_TYPES
} from '../index.js';
import {
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  findSentType,
  replyForbidden,
  replyToAuthPing,
  replyToGetSnapshot
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function waitFor(predicate: () => boolean, attempts = 100): Promise<void> {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) {
      return;
    }
    await flush();
  }
  throw new Error('waitFor timeout');
}

async function reachReady(): Promise<{
  client: ReturnType<typeof createOmniCallClient>;
  transport: NonNullable<ReturnType<ReturnType<typeof createFakeTransportController>['last']>>;
}> {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const client = createOmniCallClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    requestedProfile: 'presentation',
    requestedCapabilities: ['session.read.redacted', 'window.show'],
    keyStore: createMemoryPopKeyStore(),
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    defaultRequestTimeoutMs: 500,
    reconnect: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1_000,
      jitterRatio: 0
    },
    heartbeat: { enabled: false, intervalMs: 1_000, timeoutMs: 200 }
  });
  await client.connect();
  transports.last()?.simulateOpen();
  await waitFor(() => Boolean(findSentType(transports.last()!, 'sdk:client-hello')));
  transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
  await waitFor(() => client.getState() === 'pairing_required');
  const request = findSentType(transports.last()!, 'pairing:request') as {
    clientId: string;
  };
  transports.last()!.simulateMessage(buildPairingPending());
  transports.last()!.simulateMessage(
    buildPairingApproved({ clientId: request.clientId })
  );
  await waitFor(() => client.getState() === 'reconnecting');
  scheduler.advanceBy(100);
  const second = transports.last()!;
  second.simulateOpen();
  await waitFor(() => Boolean(findSentType(second, 'sdk:client-hello')));
  second.simulateMessage(buildServerHello({ pairingRequired: false }));
  await waitFor(() => Boolean(findSentType(second, 'sdk:auth-proof')));
  await waitFor(() => replyToAuthPing(second));
  await waitFor(() => client.getState() === 'ready');
  await waitFor(() => Boolean(findSentType(second, 'sdk:get-snapshot')));
  expect(replyToGetSnapshot(second)).toBe(true);
  await waitFor(() => client.getCachedSnapshot() !== undefined);
  return { client, transport: second };
}

describe('OmniCallClient DI-05 fixture parity', () => {
  it('accepts protocol fixture snapshot and call-incoming event shapes', async () => {
    const fixturesRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../protocol/fixtures/valid'
    );
    const snapshotFixture = readFileSync(
      path.join(fixturesRoot, 'snapshot/authenticated.json'),
      'utf8'
    );
    const eventFixture = readFileSync(
      path.join(fixturesRoot, 'event/call-incoming.json'),
      'utf8'
    );
    const { client, transport } = await reachReady();
    const fetched = client.getSnapshot();
    await waitFor(() => Boolean(findSentType(transport, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(transport, snapshotFixture, 13)).toBe(true);
    const snapshot = await fetched;
    expect(snapshot.sections.calls?.[0]?.remoteNumber).toBe('+1******7890');
    expect(snapshot.sections.calls?.[0]?.remoteDisplayName).toBe('A***');
    expect(JSON.stringify(snapshot)).not.toMatch(/\+15551234567/);
    expect(JSON.stringify(snapshot)).not.toMatch(/apiKey|sipPassword/);

    const seen: string[] = [];
    client.subscribe('call:incoming', (event) => {
      seen.push(event.payload.callId);
    });
    transport.simulateMessage(eventFixture);
    await flush();
    expect(seen).toEqual(['call_test_001']);
    expect(PUBLIC_EVENT_TYPES).not.toContain('CallAnswered');
  });

  it('does not treat server forbidden as local success', async () => {
    const { client, transport } = await reachReady();
    const promise = client.window.show();
    await waitFor(() => Boolean(findSentType(transport, 'window:show')));
    expect(replyForbidden(transport, 'window:show')).toBe(true);
    await expect(promise).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'forbidden'
    );
  });
});
