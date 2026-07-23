import { expect, test } from 'vitest';

import {
  createAxatalkClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  isAxatalkClientError
} from '../../packages/sdk/src/index.js';
import {
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  countSentType,
  findSentType,
  replyCommandSuccess,
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

test('browser AxatalkClient activateProfile success; disconnect non-activate; no storage leak', async () => {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const keyStore = createMemoryPopKeyStore();
  const client = createAxatalkClient({
    url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'browser-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-browser',
    requestedProfile: 'call_controller',
    requestedCapabilities: [
      'session.read.redacted',
      'window.show',
      'call.originate',
      'call.control',
      'account.activate'
    ],
    keyStore,
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

  expect(client.account).toBeTypeOf('object');
  expect(typeof client.account.activateProfile).toBe('function');

  await client.connect();
  transports.last()?.simulateOpen();
  await waitFor(() => Boolean(findSentType(transports.last()!, 'sdk:client-hello')));
  transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
  await waitFor(() => client.getState() === 'pairing_required');
  const request = findSentType(transports.last()!, 'pairing:request') as {
    clientId: string;
    requestedCapabilities: string[];
  };
  expect(request.requestedCapabilities).not.toContain('account.activate');
  expect(request.requestedCapabilities).not.toContain('window.hide');
  transports.last()!.simulateMessage(buildPairingPending());
  transports.last()!.simulateMessage(
    buildPairingApproved({
      clientId: request.clientId,
      profile: 'call_controller',
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'call.originate',
        'call.control',
        'account.activate'
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

  const activatePending = client.account.activateProfile({
    login: 'browser-agent@example.com',
    expectedRevision: 13
  });
  await waitFor(() =>
    Boolean(findSentType(second, 'account:activate-profile'))
  );
  expect(
    replyCommandSuccess(
      second,
      'account:activate-profile',
      { activated: true, mode: 'sip_only', profileLabel: 'B***' },
      14
    )
  ).toBe(true);
  await expect(activatePending).resolves.toEqual({
    activated: true,
    mode: 'sip_only',
    profileLabel: 'B***',
    revision: 14
  });

  client.disconnect();
  await flush();
  expect(countSentType(second, 'account:activate-profile')).toBe(1);
  expect(countSentType(second, 'call:hangup')).toBe(0);
  expect(countSentType(second, 'account:logout')).toBe(0);

  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);
  expect(keyStore.peek()).toBeDefined();

  await expect(
    client.account.activateProfile({
      login: 'browser-agent@example.com',
      expectedRevision: 14
    })
  ).rejects.toSatisfy(
    (error: unknown) =>
      isAxatalkClientError(error) && error.code === 'not_ready'
  );
});
