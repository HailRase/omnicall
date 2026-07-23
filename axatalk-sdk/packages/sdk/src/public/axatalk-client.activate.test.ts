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
  buildPairingApproved,
  buildPairingPending,
  buildPermissionChanged,
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

const BASE_CAPS = [
  'session.read.redacted',
  'window.show',
  'session.logout',
  'call.originate',
  'call.control'
] as const;

type Cap =
  | 'session.read.redacted'
  | 'window.show'
  | 'session.logout'
  | 'call.originate'
  | 'call.control'
  | 'account.activate'
  | 'operator.status.write';

function createHarness(input?: {
  readonly requestedCapabilities?: readonly Cap[];
  readonly grantedCapabilities?: readonly Cap[];
  readonly requestedProfile?: 'presentation' | 'operator' | 'call_controller';
}) {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const granted = input?.grantedCapabilities ?? [
    ...BASE_CAPS,
    'account.activate' as const
  ];
  const client = createAxatalkClient({
    url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-test',
    requestedProfile: input?.requestedProfile ?? 'call_controller',
    requestedCapabilities: input?.requestedCapabilities ?? [...BASE_CAPS],
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
    grantedCapabilities: granted
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

describe('AxatalkClient activate privilege fortress', () => {
  it('sanitize still strips account.activate and window.hide always', () => {
    for (const profile of [
      'presentation',
      'operator',
      'call_controller'
    ] as const) {
      const sanitized = sanitizeRequestedCapabilities({
        profile,
        requested: [
          'session.read.redacted',
          'account.activate',
          'window.hide',
          'session.logout'
        ]
      });
      expect(sanitized).not.toContain('account.activate');
      expect(sanitized).not.toContain('window.hide');
    }
  });

  it('returns forbidden without account.activate (no frame)', async () => {
    const harness = createHarness({
      grantedCapabilities: [...BASE_CAPS]
    });
    await reachReady(harness);
    const before = countSentType(
      harness.transports.last()!,
      'account:activate-profile'
    );
    await expect(
      harness.client.account.activateProfile({
        login: 'agent@example.com',
        expectedRevision: 13
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'forbidden'
    );
    expect(
      countSentType(harness.transports.last()!, 'account:activate-profile')
    ).toBe(before);
  });

  it('fails closed on activate before ready', async () => {
    const harness = createHarness();
    await expect(
      harness.client.account.activateProfile({
        login: 'agent@example.com',
        expectedRevision: 1
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_ready'
    );
    expect(harness.transports.all()).toHaveLength(0);
  });
});

describe('AxatalkClient activateProfile success and fail-closed', () => {
  it('activateProfile succeeds with login, mode, and expectedRevision', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13,
      mode: 'sip_only'
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    const sent = findSentType(
      harness.transports.last()!,
      'account:activate-profile'
    ) as {
      payload: {
        login: string;
        expectedRevision: number;
        mode?: 'sip_only' | 'ocp';
      };
      requestId: string;
    };
    expect(sent.payload).toEqual({
      login: 'agent@example.com',
      expectedRevision: 13,
      mode: 'sip_only'
    });
    expect(sent.requestId.length).toBeGreaterThan(0);
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:activate-profile',
        {
          activated: true,
          mode: 'sip_only',
          profileLabel: 'Agent****',
          alreadyAuthenticated: false
        },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      activated: true,
      mode: 'sip_only',
      profileLabel: 'Agent****',
      alreadyAuthenticated: false,
      revision: 14
    });
  });

  it('surfaces conflict when desktop rejects active session', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandFailure(
        harness.transports.last()!,
        'account:activate-profile',
        { code: 'conflict', retryable: false }
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'conflict'
    );
    expect(
      countSentType(harness.transports.last()!, 'account:activate-profile')
    ).toBe(1);
  });

  it('surfaces stale_state with currentRevision and does not auto-retry', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 10
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandFailure(
        harness.transports.last()!,
        'account:activate-profile',
        { code: 'stale_state', retryable: false, currentRevision: 22 }
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        error.code === 'stale_state' &&
        error.currentRevision === 22
    );
    expect(
      countSentType(harness.transports.last()!, 'account:activate-profile')
    ).toBe(1);
  });

  it('unknown login fails typed', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'unknown@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandFailure(
        harness.transports.last()!,
        'account:activate-profile',
        { code: 'not_found', retryable: false }
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_found'
    );
  });

  it('fails closed when activate success omits activated', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:activate-profile',
        { mode: 'sip_only' },
        14
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'invalid_payload'
    );
  });

  it('fails closed when activate success includes secret-looking keys', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    // `token` is wire-legal but must never invent activation success.
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:activate-profile',
        {
          activated: true,
          mode: 'sip_only',
          token: 'never-accept'
        },
        14
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'invalid_payload'
    );
  });

  it('ignores wire activate success that embeds forbidden secret keys', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandSuccess(
        harness.transports.last()!,
        'account:activate-profile',
        {
          activated: true,
          mode: 'sip_only',
          password: 'wire-forbidden-password'
        },
        14
      )
    ).toBe(true);
    harness.scheduler.advanceBy(420_000);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'timeout'
    );
  });

  it('times out when activate reply never arrives', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    harness.scheduler.advanceBy(5_000);
    // Still waiting — activate uses SDK_ACTIVATE_CLIENT_TIMEOUT_MS, not 5s default.
    expect(harness.client.getState()).toBe('ready');
    harness.scheduler.advanceBy(420_000 - 5_000);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'timeout'
    );
  });

  it('surfaces consent-phase timeout details from wire failure', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandFailure(
        harness.transports.last()!,
        'account:activate-profile',
        {
          code: 'timeout',
          retryable: false,
          details: {
            activate_phase: 'consent',
            failure_kind: 'timeout'
          }
        }
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        error.code === 'timeout' &&
        error.details?.['activate_phase'] === 'consent'
    );
  });

  it('subsequent activate forbidden after grant stripped via permission-changed', async () => {
    const harness = createHarness();
    await reachReady(harness);
    expect(harness.client.getGrantedCapabilities()).toContain('account.activate');
    harness.transports.last()!.simulateMessage(
      buildPermissionChanged([...BASE_CAPS])
    );
    await waitFor(
      () => !harness.client.getGrantedCapabilities().includes('account.activate')
    );
    const before = countSentType(
      harness.transports.last()!,
      'account:activate-profile'
    );
    await expect(
      harness.client.account.activateProfile({
        login: 'agent@example.com',
        expectedRevision: 13
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'forbidden'
    );
    expect(
      countSentType(harness.transports.last()!, 'account:activate-profile')
    ).toBe(before);
  });
});

describe('AxatalkClient activate reconnect / disconnect / privacy', () => {
  it('rejects in-flight activate-profile on reconnect and never replays', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const firstTransport = harness.transports.last()!;
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(firstTransport, 'account:activate-profile'))
    );
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
        challengeId: 'chal_act_reconnect_001',
        nonce: 'YWN0aXZhdGVyZWNv'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(30), 30)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 30);
    expect(countSentType(next, 'account:activate-profile')).toBe(0);
  });

  it('rejects in-flight activate-profile on disconnect and never tears SIP', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(transport, 'account:activate-profile'))
    );
    expect(countSentType(transport, 'account:activate-profile')).toBe(1);
    harness.client.disconnect();
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) &&
        (error.code === 'not_ready' || error.code === 'operation_failed')
    );
    await flush();
    expect(harness.client.getState()).toBe('closed');
    expect(countSentType(transport, 'account:activate-profile')).toBe(1);
    expect(countSentType(transport, 'call:hangup')).toBe(0);
    expect(countSentType(transport, 'account:logout')).toBe(0);
    const allActivate = harness.transports
      .all()
      .reduce(
        (sum, item) => sum + countSentType(item, 'account:activate-profile'),
        0
      );
    expect(allActivate).toBe(1);
  });

  it('disconnect never sends activate-profile or tears SIP', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.calls.originate({
      destination: '+15550004444',
      expectedRevision: 13
    });
    await waitFor(() => Boolean(findSentType(transport, 'call:originate')));
    expect(
      replyCommandSuccess(
        transport,
        'call:originate',
        { callId: 'call_keep_act_001', accepted: true },
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      callId: 'call_keep_act_001',
      revision: 14
    });
    harness.client.disconnect();
    await flush();
    expect(countSentType(transport, 'account:activate-profile')).toBe(0);
    expect(countSentType(transport, 'call:hangup')).toBe(0);
    expect(countSentType(transport, 'account:logout')).toBe(0);
    const allActivate = harness.transports
      .all()
      .reduce(
        (sum, item) => sum + countSentType(item, 'account:activate-profile'),
        0
      );
    expect(allActivate).toBe(0);
  });

  it('privacy: diagnostics never echo secrets / login', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.account.activateProfile({
      login: 'agent@example.com',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(
        findSentType(harness.transports.last()!, 'account:activate-profile')
      )
    );
    expect(
      replyCommandFailure(
        harness.transports.last()!,
        'account:activate-profile',
        {
          code: 'not_found',
          retryable: false,
          details: {
            hint: 'sip-password-needle-xyz',
            note: 'ocp-apikey-needle-abc'
          }
        }
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isAxatalkClientError(error) && error.code === 'not_found'
    );
    const serialized = JSON.stringify(harness.diagnostics.events);
    expect(serialized).not.toContain('sip-password-needle-xyz');
    expect(serialized).not.toContain('ocp-apikey-needle-abc');
    expect(serialized).not.toContain('agent@example.com');
  });

  it('SDK-07 regression: logout interaction_required still green', async () => {
    const harness = createHarness({
      grantedCapabilities: [...BASE_CAPS, 'account.activate', 'operator.status.write']
    });
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
          reasons: [{ id: 1, label: 'X', kind: 'logout' }]
        }
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy((error: unknown) => {
      if (!isAxatalkClientError(error) || error.code !== 'interaction_required') {
        return false;
      }
      expect(error.details).not.toHaveProperty('logoutToken');
      return true;
    });
    expect(countSentType(harness.transports.last()!, 'account:logout')).toBe(1);
  });
});

describe('AxatalkClient activate events honesty', () => {
  it('subscribes to account:session-activated by protocol name only', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const seen: string[] = [];
    const unsubscribe = harness.client.subscribe(
      'account:session-activated',
      (event) => {
        seen.push(event.type);
      }
    );
    harness.transports.last()!.simulateMessage(
      JSON.stringify({
        protocolVersion: 1,
        kind: 'event',
        type: 'account:session-activated',
        eventId: 'evt_act_001',
        sequence: 1,
        serverInstanceId: 'srv_test_001',
        sessionEpoch: 'epoch_test_001',
        occurredAt: '2026-07-20T09:00:05.000Z',
        revision: 14,
        payload: { profileLabel: 'A***' }
      })
    );
    await flush();
    expect(seen).toEqual(['account:session-activated']);
    unsubscribe();
  });
});
