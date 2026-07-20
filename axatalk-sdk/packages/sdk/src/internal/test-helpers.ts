import type { FakeScheduler } from './scheduler.js';
import { createFakeScheduler, createFixedJitterSource } from './scheduler.js';
import {
  createConnectionSession,
  type ConnectionSession
} from './connection-session.js';
import { createRecordingDiagnosticsSink } from './diagnostics.js';
import {
  createFakeTransportController,
  type FakeTransport,
  type FakeTransportController
} from './fake-transport.js';
import type { ConnectionState } from './connection-state.js';

export type SessionHarness = {
  readonly scheduler: FakeScheduler;
  readonly transports: FakeTransportController;
  readonly diagnostics: ReturnType<typeof createRecordingDiagnosticsSink>;
  readonly session: ConnectionSession;
  readonly lastTransport: () => FakeTransport;
  readonly reachReady: (path?: 'auth' | 'pairing') => void;
};

export function createSessionHarness(overrides?: {
  readonly maxReconnectAttempts?: number;
  readonly heartbeatEnabled?: boolean;
  readonly heartbeatIntervalMs?: number;
  readonly heartbeatTimeoutMs?: number;
  readonly requestTimeoutMs?: number;
}): SessionHarness {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const session = createConnectionSession({
    url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    diagnostics,
    reconnect: {
      maxAttempts: overrides?.maxReconnectAttempts ?? 3,
      initialDelayMs: 100,
      maxDelayMs: 1_000,
      jitterRatio: 0
    },
    heartbeat: {
      enabled: overrides?.heartbeatEnabled ?? false,
      intervalMs: overrides?.heartbeatIntervalMs ?? 1_000,
      timeoutMs: overrides?.heartbeatTimeoutMs ?? 200
    },
    defaultRequestTimeoutMs: overrides?.requestTimeoutMs ?? 500
  });

  return {
    scheduler,
    transports,
    diagnostics,
    session,
    lastTransport: () => {
      const transport = transports.last();
      if (transport === undefined) {
        throw new Error('expected fake transport');
      }
      return transport;
    },
    reachReady: (path = 'auth') => {
      session.connect();
      expectState(session, 'connecting');
      transports.last()?.simulateOpen();
      expectState(session, 'handshaking');
      if (path === 'pairing') {
        session.signalPairingRequired();
        expectState(session, 'pairing_required');
      }
      session.signalAuthenticating();
      expectState(session, 'authenticating');
      session.signalReady();
      expectState(session, 'ready');
    }
  };
}

export function expectState(session: ConnectionSession, state: ConnectionState): void {
  if (session.getState() !== state) {
    throw new Error(`expected state ${state}, got ${session.getState()}`);
  }
}

export function buildCommandBody(input: {
  readonly requestId: string;
  readonly commandType: 'sdk:ping' | 'call:originate' | 'sdk:get-snapshot';
}): string {
  if (input.commandType === 'call:originate') {
    return JSON.stringify({
      protocolVersion: 1,
      kind: 'command',
      type: 'call:originate',
      requestId: input.requestId,
      serverInstanceId: 'srv_test_001',
      sessionEpoch: 'epoch_test_001',
      occurredAt: '2026-07-20T09:00:02.000Z',
      payload: {
        destination: '+15551234567',
        expectedRevision: 12
      }
    });
  }
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'command',
    type: input.commandType,
    requestId: input.requestId,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:03.000Z',
    payload: {}
  });
}

export function buildSuccessReply(input: {
  readonly requestId: string;
  readonly commandType: 'sdk:ping' | 'call:originate' | 'sdk:get-snapshot';
}): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'reply',
    ok: true,
    requestId: input.requestId,
    commandType: input.commandType,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:03.050Z',
    revision: 12,
    result: {}
  });
}
