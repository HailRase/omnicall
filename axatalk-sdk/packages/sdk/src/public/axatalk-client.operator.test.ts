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
  buildOperatorStatusChangedEvent,
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  buildSnapshotMessage,
  countSentType,
  findSentType,
  replyCommandFailure,
  replyCommandSuccess,
  replyToAuthPing,
  replyToGetSnapshot
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';
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

const OPERATOR_CAPS = [
  'session.read.redacted',
  'window.show',
  'operator.status.write',
  'session.logout',
  'call.originate',
  'call.control'
] as const;

type Cap =
  | 'session.read.redacted'
  | 'window.show'
  | 'operator.status.write'
  | 'session.logout'
  | 'call.originate'
  | 'call.control';

function createHarness(input?: {
  readonly requestedCapabilities?: readonly Cap[];
  readonly grantedCapabilities?: readonly Cap[];
  readonly requestedProfile?: 'presentation' | 'operator' | 'call_controller';
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
    requestedProfile: input?.requestedProfile ?? 'call_controller',
    requestedCapabilities: input?.requestedCapabilities ?? [...OPERATOR_CAPS],
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
    grantedCapabilities: input?.grantedCapabilities ?? [...OPERATOR_CAPS]
  };
}

async function reachReady(
  harness: ReturnType<typeof createHarness>
): Promise<void> {
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
      profile: harness.grantedCapabilities.includes('call.originate')
        ? 'call_controller'
        : 'operator',
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

describe('AxatalkClient operator/logout capability fortress', () => {
  it('allows operator/logout caps on operator and call_controller; strips privileged and presentation escalate', () => {
    const operatorSanitized = sanitizeRequestedCapabilities({
      profile: 'operator',
      requested: [
        'session.read.redacted',
        'operator.status.write',
        'session.logout',
        'account.activate',
        'window.hide'
      ]
    });
    expect(operatorSanitized).toContain('operator.status.write');
    expect(operatorSanitized).toContain('session.logout');
    expect(operatorSanitized).not.toContain('account.activate');
    expect(operatorSanitized).not.toContain('window.hide');

    const controllerSanitized = sanitizeRequestedCapabilities({
      profile: 'call_controller',
      requested: [
        'session.read.redacted',
        'operator.status.write',
        'session.logout',
        'call.originate',
        'account.activate'
      ]
    });
    expect(controllerSanitized).toContain('operator.status.write');
    expect(controllerSanitized).toContain('session.logout');
    expect(controllerSanitized).not.toContain('account.activate');

    const presentationSanitized = sanitizeRequestedCapabilities({
      profile: 'presentation',
      requested: [
        'session.read.redacted',
        'window.show',
        'operator.status.write',
        'session.logout'
      ]
    });
    expect(presentationSanitized).not.toContain('operator.status.write');
    expect(presentationSanitized).not.toContain('session.logout');
  });
});

describe('AxatalkClient operator success and fail-closed', () => {
  it('getReasons returns typed reasons list', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.getReasons();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:get-reasons'))
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:get-reasons',
        {
          reasons: [
            { id: 1, label: 'Ready', kind: 'ready' },
            { id: 10, label: 'Break', kind: 'break' }
          ]
        },
        13
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      reasons: [
        { id: 1, label: 'Ready', kind: 'ready' },
        { id: 10, label: 'Break', kind: 'break' }
      ],
      revision: 13
    });
  });

  it('SIP-only getReasons empty and changeStatus not_found', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const reasonsPending = harness.client.operator.getReasons();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:get-reasons'))
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:get-reasons',
        { reasons: [] },
        13
      )
    ).toBe(true);
    await expect(reasonsPending).resolves.toEqual({ reasons: [], revision: 13 });

    const statusPending = harness.client.operator.changeStatus({
      target: 'ready',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:change-status'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'operator:change-status', {
        code: 'not_found',
        retryable: false
      })
    ).toBe(true);
    await expect(statusPending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_found'
    );
  });

  it('changeStatus succeeds with expectedRevision', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.changeStatus({
      target: 'break',
      reasonId: 10,
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:change-status'))
    );
    const sent = findSentType(
      harness.transports.last()!,
      'operator:change-status'
    ) as {
      payload: { target: string; reasonId: number; expectedRevision: number };
    };
    expect(sent.payload).toEqual({
      target: 'break',
      reasonId: 10,
      expectedRevision: 13
    });
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:change-status',
        {
          accepted: true,
          kind: 'applied',
          targetStatus: 'break',
          reasonId: 10
        },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      accepted: true,
      kind: 'applied',
      targetStatus: 'break',
      reasonId: 10,
      revision: 14
    });
  });

  it('changeStatus accepts kind reserved for post-call booking', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.changeStatus({
      target: 'ready',
      reasonId: 1,
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:change-status'))
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:change-status',
        {
          accepted: true,
          kind: 'reserved',
          targetStatus: 'ready',
          reasonId: 1
        },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      accepted: true,
      kind: 'reserved',
      targetStatus: 'ready',
      reasonId: 1,
      revision: 14
    });
  });

  it('finishAppeal succeeds with expectedRevision', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.finishAppeal({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:finish-appeal'))
    );
    const sent = findSentType(
      harness.transports.last()!,
      'operator:finish-appeal'
    ) as {
      payload: { expectedRevision: number };
    };
    expect(sent.payload).toEqual({ expectedRevision: 13 });
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:finish-appeal',
        {
          accepted: true,
          kind: 'applied',
          targetStatus: 'ready',
          reasonId: 1
        },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      accepted: true,
      kind: 'applied',
      targetStatus: 'ready',
      reasonId: 1,
      revision: 14
    });
  });

  it('finishAppeal surfaces conflict when not in post-call processing', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.finishAppeal({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:finish-appeal'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'operator:finish-appeal', {
        code: 'conflict',
        retryable: false,
        details: { failure_kind: 'not_in_post_call_processing' }
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'conflict'
    );
    expect(
      countSentType(harness.transports.last()!, 'operator:finish-appeal')
    ).toBe(1);
  });

  it('returns forbidden without operator.status.write (no frame)', async () => {
    const harness = createHarness({
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'session.logout'
      ]
    });
    await reachReady(harness);
    await expect(harness.client.operator.getReasons()).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'forbidden'
    );
    expect(
      countSentType(harness.transports.last()!, 'operator:get-reasons')
    ).toBe(0);
  });

  it('surfaces stale_state with currentRevision and does not auto-retry', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.changeStatus({
      target: 'ready',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:change-status'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'operator:change-status', {
        code: 'stale_state',
        retryable: true,
        currentRevision: 22
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        error.code === 'stale_state' &&
        error.currentRevision === 22
    );
    expect(
      countSentType(harness.transports.last()!, 'operator:change-status')
    ).toBe(1);
  });

  it('surfaces conflict on changeStatus and does not auto-retry', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.changeStatus({
      target: 'break',
      reasonId: 7,
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:change-status'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'operator:change-status', {
        code: 'conflict',
        retryable: false
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'conflict'
    );
    expect(
      countSentType(harness.transports.last()!, 'operator:change-status')
    ).toBe(1);
  });

  it('fails closed when getReasons reply omits reasons', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.operator.getReasons();
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'operator:get-reasons'))
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'operator:get-reasons',
        { accepted: true },
        13
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'invalid_payload'
    );
  });
});

describe('AxatalkClient account logout workflows', () => {
  it('logout → interaction_required with requiresReason; never auto-retries', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'account:logout', {
        code: 'interaction_required',
        retryable: false,
        details: {
          requiresReason: true,
          reasons: [{ id: 90, label: 'End of shift', kind: 'logout' }]
        }
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy((error: unknown) => {
      if (!isAxatalkClientError(error) || error.code !== 'interaction_required') {
        return false;
      }
      expect(error.details).toEqual({
        requiresReason: true,
        reasons: [{ id: 90, label: 'End of shift', kind: 'logout' }]
      });
      expect(error.details).not.toHaveProperty('logoutToken');
      return true;
    });
    expect(countSentType(harness.transports.last()!, 'account:logout')).toBe(1);
  });

  it('SIP-only logout succeeds without reasonId', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    const sent = findSentType(harness.transports.last()!, 'account:logout') as {
      payload: { expectedRevision: number; reasonId?: number };
    };
    expect(sent.payload).toEqual({ expectedRevision: 13 });
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:logout',
        { loggedOut: true, ocpStep: 'skipped', operatorSnapshotMissing: true },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      loggedOut: true,
      revision: 14
    });
  });

  it('logout with reasonId succeeds', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      reasonId: 90,
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    const sent = findSentType(harness.transports.last()!, 'account:logout') as {
      payload: { expectedRevision: number; reasonId: number };
    };
    expect(sent.payload).toEqual({ reasonId: 90, expectedRevision: 13 });
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:logout',
        { loggedOut: true, ocpStep: 'completed', operatorSnapshotMissing: false },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      loggedOut: true,
      revision: 14
    });
  });

  it('returns forbidden without session.logout (no frame)', async () => {
    const harness = createHarness({
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'operator.status.write'
      ]
    });
    await reachReady(harness);
    await expect(
      harness.client.account.logout({ expectedRevision: 13 })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'forbidden'
    );
    expect(countSentType(harness.transports.last()!, 'account:logout')).toBe(0);
  });

  it('fails closed when logout success omits loggedOut', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:logout',
        { accepted: true },
        13
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'invalid_payload'
    );
  });

  it('times out when logout reply never arrives', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    harness.scheduler.advanceBy(500);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'timeout'
    );
  });

  it('fails closed on mutate before ready', async () => {
    const harness = createHarness();
    await expect(
      harness.client.account.logout({ expectedRevision: 1 })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
    await expect(
      harness.client.operator.changeStatus({
        target: 'ready',
        expectedRevision: 1
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
  });
});

describe('AxatalkClient operator/logout reconnect and disconnect safety', () => {
  it('rejects in-flight change-status on reconnect and never replays', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const firstTransport = harness.transports.last()!;
    const pending = harness.client.operator.changeStatus({
      target: 'ready',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(firstTransport, 'operator:change-status'))
    );
    expect(countSentType(firstTransport, 'operator:change-status')).toBe(1);
    firstTransport.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        (error.code === 'not_ready' || error.code === 'operation_failed')
    );
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_op_reconnect_001',
        nonce: 'b3ByZWNvbm5lY3Q'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(30), 30)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 30);
    expect(countSentType(next, 'operator:change-status')).toBe(0);
    expect(countSentType(next, 'account:logout')).toBe(0);
  });

  it('rejects in-flight logout on reconnect and never replays', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const firstTransport = harness.transports.last()!;
    const pending = harness.client.account.logout({
      reasonId: 90,
      expectedRevision: 13
    });
    await waitFor(() => Boolean(findSentType(firstTransport, 'account:logout')));
    firstTransport.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        (error.code === 'not_ready' || error.code === 'operation_failed')
    );
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_logout_reconnect_001',
        nonce: 'bG9nb3V0cmVjb25u'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(31), 31)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 31);
    expect(countSentType(next, 'account:logout')).toBe(0);
  });

  it('disconnect after getReasons does not send logout or hangup', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.operator.getReasons();
    await waitFor(() =>
      Boolean(findSentType(transport, 'operator:get-reasons'))
    );
    expect(
      replyCommandSuccess(
        transport,
        'operator:get-reasons',
        {
          reasons: [{ id: 90, label: 'End of shift', kind: 'logout' }]
        },
        13
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      reasons: [{ id: 90, label: 'End of shift', kind: 'logout' }],
      revision: 13
    });
    harness.client.disconnect();
    await flush();
    expect(countSentType(transport, 'account:logout')).toBe(0);
    expect(countSentType(transport, 'call:hangup')).toBe(0);
    expect(harness.client.getState()).toBe('closed');
    const allLogout = harness.transports
      .all()
      .reduce((sum, item) => sum + countSentType(item, 'account:logout'), 0);
    expect(allLogout).toBe(0);
  });

  it('SDK-06 regression: disconnect after originate still sends no hangup', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.calls.originate({
      destination: '+15550003333',
      expectedRevision: 13
    });
    await waitFor(() => Boolean(findSentType(transport, 'call:originate')));
    expect(
      replyCommandSuccess(
        transport,
        'call:originate',
        { callId: 'call_keep_op_001', accepted: true },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      callId: 'call_keep_op_001',
      revision: 14
    });
    harness.client.disconnect();
    await flush();
    expect(countSentType(transport, 'call:hangup')).toBe(0);
    expect(countSentType(transport, 'account:logout')).toBe(0);
  });

  it('privacy: diagnostics never echo secret needles / destinations', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.logout({
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'account:logout'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'account:logout', {
        code: 'interaction_required',
        retryable: false,
        details: {
          requiresReason: true,
          reasons: [{ id: 1, label: 'logout_secret_needle_xyz', kind: 'logout' }]
        }
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'interaction_required'
    );
    const serialized = JSON.stringify(harness.diagnostics.events);
    expect(serialized).not.toContain('logout_secret_needle_xyz');
    expect(serialized).not.toContain('+1555');
    expect(serialized).not.toContain('destination');
  });
});

describe('AxatalkClient operator events honesty', () => {
  it('subscribes to operator:status-changed without Domain names', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const seen: string[] = [];
    const unsubscribe = harness.client.subscribe(
      'operator:status-changed',
      (event) => {
        seen.push(event.type);
      }
    );
    harness.transports.last()!.simulateMessage(
      buildOperatorStatusChangedEvent(1)
    );
    await flush();
    expect(seen).toEqual(['operator:status-changed']);
    unsubscribe();
  });
});
