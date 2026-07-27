import { describe, expect, it } from 'vitest';

import {
  createOmniCallClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  createRecordingDiagnosticsSink,
  isOmniCallClientError
} from '../index.js';
import {
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  buildSnapshotMessage,
  countSentType,
  findSentType,
  replyCallSuccess,
  replyCallSuccessMalformed,
  replyCommandFailure,
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

const CALL_CAPS = [
  'session.read.redacted',
  'window.show',
  'call.originate',
  'call.control',
  'call.answer',
  'call.reject',
  'call.hangup',
  'call.hold',
  'call.mute'
] as const;

type CallTestCap =
  | 'session.read.redacted'
  | 'window.show'
  | 'call.originate'
  | 'call.control'
  | 'call.answer'
  | 'call.reject'
  | 'call.hangup'
  | 'call.hold'
  | 'call.mute';

function createHarness(input?: {
  readonly requestedCapabilities?: readonly CallTestCap[];
  readonly grantedCapabilities?: readonly CallTestCap[];
  readonly requestedProfile?: 'presentation' | 'call_controller';
}) {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const client = createOmniCallClient({
    url: 'ws://127.0.0.1:17341/omnicall/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'fixture-crm', version: '1.0.0' },
    sdkVersion: '0.0.0-test',
    requestedProfile: input?.requestedProfile ?? 'call_controller',
    requestedCapabilities: input?.requestedCapabilities ?? [...CALL_CAPS],
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
    grantedCapabilities: input?.grantedCapabilities ?? [...CALL_CAPS]
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

async function expectCallSuccess(
  harness: ReturnType<typeof createHarness>,
  commandType: string,
  invoke: () => Promise<{ readonly callId: string; readonly revision: number }>,
  callId: string,
  revision: number
): Promise<void> {
  const pending = invoke();
  await waitFor(() =>
    Boolean(findSentType(harness.transports.last()!, commandType))
  );
  const sent = findSentType(harness.transports.last()!, commandType) as {
    payload: { expectedRevision: number };
  };
  expect(sent.payload.expectedRevision).toBe(13);
  expect(replyCallSuccess(harness.transports.last()!, commandType, callId, revision)).toBe(
    true
  );
  await expect(pending).resolves.toEqual({ callId, revision });
}

describe('OmniCallClient calls capability request', () => {
  it('allows call caps on call_controller and still strips privileged', () => {
    const sanitized = sanitizeRequestedCapabilities({
      profile: 'call_controller',
      requested: [
        'session.read.redacted',
        'call.originate',
        'call.control',
        'account.activate',
        'window.hide'
      ]
    });
    expect(sanitized).toContain('call.originate');
    expect(sanitized).toContain('call.control');
    expect(sanitized).not.toContain('account.activate');
    expect(sanitized).not.toContain('window.hide');
  });
});

describe('OmniCallClient calls success paths', () => {
  it('originates with call.originate and expectedRevision', async () => {
    const harness = createHarness();
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:originate',
      () =>
        harness.client.calls.originate({
          destination: '+15550001111',
          expectedRevision: 13
        }),
      'call_orig_001',
      14
    );
    const sent = findSentType(harness.transports.last()!, 'call:originate') as {
      payload: { destination: string };
    };
    expect(sent.payload.destination).toBe('+15550001111');
  });

  it('answers and rejects with call.control', async () => {
    const harness = createHarness();
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:answer',
      () =>
        harness.client.calls.answer({
          callId: 'call_in_001',
          expectedRevision: 13
        }),
      'call_in_001',
      14
    );
    await expectCallSuccess(
      harness,
      'call:reject',
      () =>
        harness.client.calls.reject({
          callId: 'call_in_002',
          expectedRevision: 13
        }),
      'call_in_002',
      15
    );
  });

  it('hangs up with call.control', async () => {
    const harness = createHarness();
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:hangup',
      () =>
        harness.client.calls.hangup({
          callId: 'call_active_001',
          expectedRevision: 13
        }),
      'call_active_001',
      14
    );
  });

  it('holds and resumes with call.control', async () => {
    const harness = createHarness();
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:hold',
      () =>
        harness.client.calls.hold({
          callId: 'call_hold_001',
          expectedRevision: 13
        }),
      'call_hold_001',
      14
    );
    await expectCallSuccess(
      harness,
      'call:resume',
      () =>
        harness.client.calls.resume({
          callId: 'call_hold_001',
          expectedRevision: 13
        }),
      'call_hold_001',
      15
    );
  });

  it('mutes and unmutes with call.control', async () => {
    const harness = createHarness();
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:mute',
      () =>
        harness.client.calls.mute({
          callId: 'call_mute_001',
          expectedRevision: 13
        }),
      'call_mute_001',
      14
    );
    await expectCallSuccess(
      harness,
      'call:unmute',
      () =>
        harness.client.calls.unmute({
          callId: 'call_mute_001',
          expectedRevision: 13
        }),
      'call_mute_001',
      15
    );
  });

  it('sends DTMF with call.control', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.sendDtmf({
      callId: 'call_dtmf_001',
      digits: '12*#',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:send-dtmf'))
    );
    const sent = findSentType(harness.transports.last()!, 'call:send-dtmf') as {
      payload: { digits: string; callId: string; expectedRevision: number };
    };
    expect(sent.payload).toEqual({
      callId: 'call_dtmf_001',
      digits: '12*#',
      expectedRevision: 13
    });
    expect(
      replyCallSuccess(
        harness.transports.last()!,
        'call:send-dtmf',
        'call_dtmf_001',
        14
      )
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      callId: 'call_dtmf_001',
      revision: 14
    });
  });
});

describe('OmniCallClient calls fail-closed and typed errors', () => {
  it('fails closed on mutate before ready', async () => {
    const harness = createHarness();
    await harness.client.connect();
    await expect(
      harness.client.calls.originate({
        destination: '+15550001111',
        expectedRevision: 1
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'not_ready'
    );
  });

  it('returns forbidden without call.originate', async () => {
    const harness = createHarness({
      grantedCapabilities: ['session.read.redacted', 'window.show', 'call.control']
    });
    await reachReady(harness);
    await expect(
      harness.client.calls.originate({
        destination: '+15550001111',
        expectedRevision: 13
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'forbidden'
    );
    expect(countSentType(harness.transports.last()!, 'call:originate')).toBe(0);
  });

  it('returns forbidden without call.hold or call.control for hold', async () => {
    const harness = createHarness({
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'call.originate'
      ]
    });
    await reachReady(harness);
    await expect(
      harness.client.calls.hold({
        callId: 'call_x',
        expectedRevision: 13
      })
    ).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'forbidden'
    );
    expect(countSentType(harness.transports.last()!, 'call:hold')).toBe(0);
  });

  it('holds with granular call.hold without umbrella call.control', async () => {
    const harness = createHarness({
      grantedCapabilities: [
        'session.read.redacted',
        'window.show',
        'call.hold'
      ]
    });
    await reachReady(harness);
    await expectCallSuccess(
      harness,
      'call:hold',
      () =>
        harness.client.calls.hold({
          callId: 'call_1',
          expectedRevision: 13
        }),
      'call_1',
      14
    );
  });

  it('surfaces stale_state with currentRevision and does not auto-retry', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.hangup({
      callId: 'call_stale_001',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:hangup'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'call:hangup', {
        code: 'stale_state',
        retryable: true,
        currentRevision: 20
      })
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) &&
        error.code === 'stale_state' &&
        error.currentRevision === 20
    );
    expect(countSentType(harness.transports.last()!, 'call:hangup')).toBe(1);
  });

  it('surfaces conflict and not_owner typed failures', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const conflictPending = harness.client.calls.mute({
      callId: 'call_conflict_001',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:mute'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'call:mute', {
        code: 'conflict',
        retryable: false
      })
    ).toBe(true);
    await expect(conflictPending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'conflict'
    );

    const ownerPending = harness.client.calls.hangup({
      callId: 'call_owner_001',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:hangup'))
    );
    expect(
      replyCommandFailure(harness.transports.last()!, 'call:hangup', {
        code: 'not_owner',
        retryable: false
      })
    ).toBe(true);
    await expect(ownerPending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'not_owner'
    );
  });

  it('times out when call reply never arrives', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.answer({
      callId: 'call_timeout_001',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:answer'))
    );
    harness.scheduler.advanceBy(500);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'timeout'
    );
  });

  it('fails closed when success reply omits callId', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const pending = harness.client.calls.originate({
      destination: '+15550005555',
      expectedRevision: 13
    });
    await waitFor(() =>
      Boolean(findSentType(harness.transports.last()!, 'call:originate'))
    );
    expect(
      replyCallSuccessMalformed(
        harness.transports.last()!,
        'call:originate',
        14
      )
    ).toBe(true);
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) && error.code === 'invalid_payload'
    );
  });
});

describe('OmniCallClient calls reconnect and disconnect safety', () => {
  it('rejects in-flight mutate on reconnect and never replays', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const firstTransport = harness.transports.last()!;
    const pending = harness.client.calls.originate({
      destination: '+15550002222',
      expectedRevision: 13
    });
    await waitFor(() => Boolean(findSentType(firstTransport, 'call:originate')));
    expect(countSentType(firstTransport, 'call:originate')).toBe(1);
    firstTransport.simulateClose(1006, 'drop');
    await waitFor(() => harness.client.getState() === 'reconnecting');
    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        isOmniCallClientError(error) &&
        (error.code === 'not_ready' || error.code === 'operation_failed')
    );
    harness.scheduler.advanceBy(100);
    const next = harness.transports.last()!;
    next.simulateOpen();
    await waitFor(() => Boolean(findSentType(next, 'sdk:client-hello')));
    next.simulateMessage(
      buildServerHello({
        pairingRequired: false,
        challengeId: 'chal_call_reconnect_001',
        nonce: 'Y2FsbHJlY29ubmVj'
      })
    );
    await waitFor(() => Boolean(findSentType(next, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(next));
    await waitFor(() => harness.client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(next, 'sdk:get-snapshot')));
    expect(replyToGetSnapshot(next, buildSnapshotMessage(30), 30)).toBe(true);
    await waitFor(() => harness.client.getRevision() === 30);
    expect(countSentType(next, 'call:originate')).toBe(0);
    expect(countSentType(next, 'call:hangup')).toBe(0);
  });

  it('disconnect after successful originate does not send hangup', async () => {
    const harness = createHarness();
    await reachReady(harness);
    const transport = harness.transports.last()!;
    const pending = harness.client.calls.originate({
      destination: '+15550003333',
      expectedRevision: 13
    });
    await waitFor(() => Boolean(findSentType(transport, 'call:originate')));
    expect(
      replyCallSuccess(transport, 'call:originate', 'call_keep_001', 14)
    ).toBe(true);
    await expect(pending).resolves.toEqual({
      callId: 'call_keep_001',
      revision: 14
    });
    harness.client.disconnect();
    await flush();
    expect(countSentType(transport, 'call:hangup')).toBe(0);
    expect(harness.client.getState()).toBe('closed');
    const allHangups = harness.transports
      .all()
      .reduce((sum, item) => sum + countSentType(item, 'call:hangup'), 0);
    expect(allHangups).toBe(0);
  });
});
