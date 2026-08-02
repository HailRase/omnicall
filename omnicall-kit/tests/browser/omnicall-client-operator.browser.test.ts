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
  countSentType,
  findSentType,
  replyCommandFailure,
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

test('browser OmniCallClient operator getReasons + logout; disconnect does not logout', async () => {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const client = createOmniCallClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'browser-crm', version: '1.0.0' },
    requestedProfile: 'operator',
    requestedCapabilities: [
      'session.read.redacted',
      'window.show',
      'operator.status.write',
      'session.logout'
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

  expect(client.operator).toBeTypeOf('object');
  expect(client.account).toBeTypeOf('object');

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
      profile: 'operator',
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'operator.status.write',
        'session.logout'
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

  const reasonsPending = client.operator.getReasons();
  await waitFor(() => Boolean(findSentType(second, 'operator:get-reasons')));
  expect(
    replyCommandSuccess(
      second,
      'operator:get-reasons',
      { reasons: [] },
      13
    )
  ).toBe(true);
  await expect(reasonsPending).resolves.toEqual({ reasons: [], revision: 13 });

  const logoutPending = client.account.logout({ expectedRevision: 13 });
  await waitFor(() => Boolean(findSentType(second, 'account:logout')));
  expect(
    replyCommandFailure(second, 'account:logout', {
      code: 'interaction_required',
      retryable: false,
      details: {
        requiresReason: true,
        reasons: [{ id: 90, label: 'End', kind: 'logout' }]
      }
    })
  ).toBe(true);
  await expect(logoutPending).rejects.toSatisfy((error: unknown) => {
    if (!isOmniCallClientError(error) || error.code !== 'interaction_required') {
      return false;
    }
    expect(error.details).not.toHaveProperty('logoutToken');
    return true;
  });
  expect(countSentType(second, 'account:logout')).toBe(1);

  client.disconnect();
  await flush();
  expect(countSentType(second, 'account:logout')).toBe(1);
  expect(window.localStorage.length).toBe(0);
  expect(window.sessionStorage.length).toBe(0);
});
