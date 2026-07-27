import { describe, expect, it } from 'vitest';

import {
  createAuthClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  isOriginBlockedError
} from '../index.js';
import {
  buildOriginDeniedReply,
  buildServerHello,
  findSentType
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

function createHarness() {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const client = createAuthClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-test',
    requestedProfile: 'presentation',
    requestedCapabilities: ['session.read.redacted', 'window.show'],
    keyStore: createMemoryPopKeyStore(),
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    reconnect: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1_000,
      jitterRatio: 0
    },
    heartbeat: { enabled: false, intervalMs: 1_000, timeoutMs: 200 }
  });
  return { scheduler, transports, client };
}

describe('origin policy connect failures', () => {
  it('surfaces non-retryable origin_blocked on upgrade reject and never reconnects', async () => {
    const harness = createHarness();
    await harness.client.connect();
    const transport = harness.transports.last()!;
    transport.simulateClose(1006, 'origin_denied');

    await waitFor(() => harness.client.getState() === 'failed');
    expect(harness.client.getState()).not.toBe('reconnecting');

    const error = harness.client.getConnectError();
    expect(error?.code).toBe('origin_blocked');
    expect(error?.retryable).toBe(false);
    expect(isOriginBlockedError(error)).toBe(true);

    harness.scheduler.advanceBy(500);
    expect(harness.transports.all()).toHaveLength(1);
  });

  it('stops reconnect when wire forbidden carries origin_denied during handshake', async () => {
    const harness = createHarness();
    await harness.client.connect();
    const transport = harness.transports.last()!;
    transport.simulateOpen();
    await waitFor(() => Boolean(findSentType(transport, 'sdk:client-hello')));
    transport.simulateMessage(buildServerHello({ pairingRequired: true }));
    await waitFor(() => harness.client.getState() === 'pairing_required');

    transport.simulateMessage(buildOriginDeniedReply());
    await waitFor(() => harness.client.getState() === 'failed');
    expect(harness.client.getState()).not.toBe('reconnecting');

    const error = harness.client.getConnectError();
    expect(error?.code).toBe('forbidden');
    expect(error?.details).toEqual({ origin_denied: true });
    expect(isOriginBlockedError(error)).toBe(true);

    harness.scheduler.advanceBy(500);
    expect(harness.transports.all()).toHaveLength(1);
  });
});
