import { describe, expect, it } from 'vitest';

import {
  buildCommandBody,
  buildSuccessReply,
  createSessionHarness,
  expectState
} from './test-helpers.js';
import { diagnosticContainsForbiddenText } from './diagnostics.js';
import { computeReconnectDelayMs } from './reconnect-policy.js';
import { createFixedJitterSource } from './scheduler.js';

describe('connection session lifecycle', () => {
  it('walks idle → ready via authenticating and closes cleanly', () => {
    const harness = createSessionHarness();
    harness.reachReady('auth');
    harness.session.disconnect();
    expectState(harness.session, 'closed');
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
    expect(harness.session.pendingRequestCount()).toBe(0);
    const transport = harness.lastTransport();
    expect(transport.openListenerCount()).toBe(0);
    expect(transport.messageListenerCount()).toBe(0);
    expect(transport.closeListenerCount()).toBe(0);
    expect(transport.errorListenerCount()).toBe(0);
  });

  it('walks pairing_required branch', () => {
    const harness = createSessionHarness();
    harness.reachReady('pairing');
    expectState(harness.session, 'ready');
  });

  it('enters incompatible / revoked / failed terminal states', () => {
    const incompatible = createSessionHarness();
    incompatible.session.connect();
    incompatible.lastTransport().simulateOpen();
    incompatible.session.signalIncompatible();
    expectState(incompatible.session, 'incompatible');

    const revoked = createSessionHarness();
    revoked.reachReady();
    revoked.session.signalRevoked();
    expectState(revoked.session, 'revoked');

    const failed = createSessionHarness();
    failed.reachReady();
    failed.session.signalFailed();
    expectState(failed.session, 'failed');
  });
});

describe('request correlation and cleanup', () => {
  it('correlates reply by requestId and clears pending', async () => {
    const harness = createSessionHarness();
    harness.reachReady();
    const requestId = 'req_ping_001';
    const pending = harness.session.request({
      requestId,
      commandType: 'sdk:ping',
      body: buildCommandBody({ requestId, commandType: 'sdk:ping' })
    });
    expect(harness.session.pendingRequestCount()).toBe(1);
    harness.lastTransport().simulateMessage(
      buildSuccessReply({ requestId, commandType: 'sdk:ping' })
    );
    const result = await pending;
    expect(result.ok).toBe(true);
    expect(harness.session.pendingRequestCount()).toBe(0);
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
  });

  it('times out pending requests and clears timers', async () => {
    const harness = createSessionHarness({ requestTimeoutMs: 100 });
    harness.reachReady();
    const pending = harness.session.request({
      requestId: 'req_timeout_001',
      commandType: 'sdk:get-snapshot',
      body: buildCommandBody({
        requestId: 'req_timeout_001',
        commandType: 'sdk:get-snapshot'
      }),
      timeoutMs: 100
    });
    expect(harness.session.pendingRequestCount()).toBe(1);
    harness.scheduler.advanceBy(100);
    const result = await pending;
    expect(result).toEqual({
      ok: false,
      errorCode: 'timeout',
      reason: 'timeout'
    });
    expect(harness.session.pendingRequestCount()).toBe(0);
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
  });

  it('rejects pending requests on abort and disconnect without leaks', async () => {
    const harness = createSessionHarness();
    harness.reachReady();
    const controller = new AbortController();
    const aborted = harness.session.request({
      requestId: 'req_abort_001',
      commandType: 'sdk:ping',
      body: buildCommandBody({ requestId: 'req_abort_001', commandType: 'sdk:ping' }),
      signal: controller.signal
    });
    controller.abort();
    await expect(aborted).resolves.toEqual({
      ok: false,
      errorCode: 'operation_failed',
      reason: 'aborted'
    });

    const dropped = harness.session.request({
      requestId: 'req_drop_001',
      commandType: 'sdk:ping',
      body: buildCommandBody({ requestId: 'req_drop_001', commandType: 'sdk:ping' })
    });
    harness.session.disconnect();
    await expect(dropped).resolves.toEqual({
      ok: false,
      errorCode: 'operation_failed',
      reason: 'aborted'
    });
    expect(harness.session.pendingRequestCount()).toBe(0);
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
  });
});

describe('reconnect and mutation non-replay', () => {
  it('uses bounded jittered reconnect delays', () => {
    const policy = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 10_000,
      jitterRatio: 0.2
    };
    const delay = computeReconnectDelayMs(policy, 2, createFixedJitterSource(0.5));
    expect(delay).toBe(400);
  });

  it('reconnects after transport drop and never replays mutations', async () => {
    const harness = createSessionHarness({ maxReconnectAttempts: 2 });
    harness.reachReady();
    const mutationBody = buildCommandBody({
      requestId: 'req_mut_001',
      commandType: 'call:originate'
    });
    const mutationPromise = harness.session.request({
      requestId: 'req_mut_001',
      commandType: 'call:originate',
      body: mutationBody
    });
    expect(harness.session.mutationSendCount()).toBe(1);
    const firstTransport = harness.lastTransport();
    expect(firstTransport.sent.filter((item) => item === mutationBody)).toHaveLength(1);

    firstTransport.simulateClose(1006, 'drop');
    expectState(harness.session, 'reconnecting');
    await expect(mutationPromise).resolves.toEqual({
      ok: false,
      errorCode: 'operation_failed',
      reason: 'disconnect'
    });

    harness.scheduler.advanceBy(100);
    expectState(harness.session, 'connecting');
    const second = harness.lastTransport();
    second.simulateOpen();
    expectState(harness.session, 'handshaking');
    harness.session.signalAuthenticating();
    harness.session.signalReady();
    expectState(harness.session, 'ready');

    expect(second.sent.filter((item) => item === mutationBody)).toHaveLength(0);
    expect(harness.session.mutationSendCount()).toBe(1);
    expect(harness.session.pendingRequestCount()).toBe(0);
  });

  it('fails after reconnect budget is exhausted and clears timers', () => {
    const harness = createSessionHarness({ maxReconnectAttempts: 1 });
    harness.reachReady();
    harness.lastTransport().simulateClose(1006, 'drop');
    expectState(harness.session, 'reconnecting');
    harness.scheduler.advanceBy(100);
    expectState(harness.session, 'connecting');
    // Connection attempt fails before open — still counts against budget.
    harness.lastTransport().simulateClose(1006, 'drop-again');
    expectState(harness.session, 'failed');
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
  });
});

describe('heartbeat', () => {
  it('sends ping on interval and reconnects on miss without leaking timers', async () => {
    const harness = createSessionHarness({
      heartbeatEnabled: true,
      heartbeatIntervalMs: 100,
      heartbeatTimeoutMs: 50,
      maxReconnectAttempts: 2
    });
    harness.reachReady();
    await harness.scheduler.advanceByAsync(100);
    const transport = harness.lastTransport();
    const ping = transport.sent.find((item) => item.includes('"sdk:ping"'));
    expect(ping).toBeTypeOf('string');
    await harness.scheduler.advanceByAsync(50);
    expectState(harness.session, 'reconnecting');
    expect(harness.session.pendingRequestCount()).toBe(0);
    harness.session.disconnect();
    expect(harness.scheduler.pendingTimerCount()).toBe(0);
  });
});

describe('redaction-safe diagnostics', () => {
  it('records allowlisted fields only and never includes secret/PII needles', async () => {
    const harness = createSessionHarness();
    harness.reachReady();
    const secretNeedle = 'super-secret-token';
    const phoneNeedle = '+15551234567';
    const bodyWithSecrets = JSON.stringify({
      protocolVersion: 1,
      kind: 'command',
      type: 'call:originate',
      requestId: 'req_diag_001',
      serverInstanceId: 'srv_test_001',
      sessionEpoch: 'epoch_test_001',
      occurredAt: '2026-07-20T09:00:02.000Z',
      payload: {
        destination: phoneNeedle,
        authorization: secretNeedle,
        expectedRevision: 12
      }
    });
    const pending = harness.session.request({
      requestId: 'req_diag_001',
      commandType: 'call:originate',
      body: bodyWithSecrets
    });
    harness.lastTransport().simulateMessage(
      buildSuccessReply({ requestId: 'req_diag_001', commandType: 'call:originate' })
    );
    await pending;
    harness.session.disconnect();

    expect(harness.diagnostics.events.length).toBeGreaterThan(0);
    for (const event of harness.diagnostics.events) {
      expect(diagnosticContainsForbiddenText(event, [secretNeedle, phoneNeedle])).toBe(
        false
      );
      expect(event).not.toHaveProperty('payload');
      expect(event).not.toHaveProperty('body');
      expect(event).not.toHaveProperty('authorization');
    }
  });
});
