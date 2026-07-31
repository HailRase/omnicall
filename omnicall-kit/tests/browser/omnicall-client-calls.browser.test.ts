import { expect, test } from 'vitest';

import {
  createOmniCallClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  isOmniCallClientError
} from '../../packages/sdk/src/index.js';
import {
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  findSentType,
  replyCallSuccess,
  replyToAuthPing,
  replyToGetSnapshot
} from '../../packages/sdk/src/internal/auth-test-peer.js';
import { createFakeTransportController } from '../../packages/sdk/src/internal/fake-transport.js';

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

test('browser OmniCallClient call originate settles typed after mocked ready', async () => {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const client = createOmniCallClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'browser-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-browser',
    requestedProfile: 'call_controller',
    requestedCapabilities: [
      'session.read.redacted',
      'window.show',
      'call.originate',
      'call.control'
    ],
    keyStore: createMemoryPopKeyStore(),
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    defaultRequestTimeoutMs: 500,
    heartbeat: { enabled: false, intervalMs: 1_000, timeoutMs: 200 },
    reconnect: {
      maxAttempts: 2,
      initialDelayMs: 50,
      maxDelayMs: 200,
      jitterRatio: 0
    }
  });

  expect(client.getState()).toBe('idle');
  expect(transports.last()).toBeUndefined();
  expect(client.calls).toBeTypeOf('object');

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
    buildPairingApproved({
      clientId: request.clientId,
      profile: 'call_controller',
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'call.originate',
        'call.control'
      ]
    })
  );
  await waitFor(() => client.getState() === 'reconnecting');
  scheduler.advanceBy(50);
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

  const pending = client.calls.originate({
    destination: '+15550004444',
    expectedRevision: 13
  });
  await waitFor(() => Boolean(findSentType(second, 'call:originate')));
  expect(replyCallSuccess(second, 'call:originate', 'call_browser_001', 14)).toBe(
    true
  );
  await expect(pending).resolves.toEqual({
    callId: 'call_browser_001',
    revision: 14
  });

  client.disconnect();
  await flush();
  expect(
    second.sent.filter((item) => item.includes('"call:hangup"')).length
  ).toBe(0);
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);

  await expect(
    client.calls.hangup({ callId: 'call_browser_001', expectedRevision: 14 })
  ).rejects.toSatisfy(
    (error: unknown) =>
      isOmniCallClientError(error) && error.code === 'not_ready'
  );
});
