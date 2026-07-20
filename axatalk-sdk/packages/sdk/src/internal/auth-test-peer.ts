/**
 * Deterministic fake desktop peer for auth/pairing unit tests.
 */

import type { CapabilityId, PairingProfile } from '@axatalk/protocol';

import type { FakeTransport } from './fake-transport.js';

export function buildServerHello(input: {
  readonly pairingRequired: boolean;
  readonly serverInstanceId?: string;
  readonly sessionEpoch?: string;
  readonly challengeId?: string;
  readonly nonce?: string;
  readonly selectedProtocolVersion?: number;
}): string {
  const base = {
    protocolVersion: 1,
    kind: 'handshake',
    type: 'sdk:server-hello',
    selectedProtocolVersion: input.selectedProtocolVersion ?? 1,
    desktopVersion: '0.11.2-test',
    serverInstanceId: input.serverInstanceId ?? 'srv_test_001',
    sessionEpoch: input.sessionEpoch ?? 'epoch_test_001',
    serverNonce: 'c2VydmVybm9uY2U0NTY',
    pairingRequired: input.pairingRequired,
    maxMessageBytes: 65_536,
    heartbeatSeconds: 15,
    occurredAt: '2026-07-20T09:00:00.100Z'
  };
  if (input.pairingRequired) {
    return JSON.stringify(base);
  }
  return JSON.stringify({
    ...base,
    authChallenge: {
      challengeId: input.challengeId ?? 'chal_test_001',
      nonce: input.nonce ?? 'Y2hhbGxlbmdlbm9uY2U',
      expiresAt: '2026-07-20T09:01:00.000Z'
    }
  });
}

export function buildPairingPending(): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'pairing',
    type: 'pairing:pending',
    pairingRequestId: 'pair_test_001',
    expiresAt: '2026-07-20T09:05:00.000Z',
    occurredAt: '2026-07-20T09:00:00.150Z'
  });
}

export function buildPairingApproved(input: {
  readonly clientId: string;
  readonly profile?: PairingProfile;
  readonly grantedCapabilities?: readonly CapabilityId[];
}): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'pairing',
    type: 'pairing:approved',
    clientId: input.clientId,
    profile: input.profile ?? 'presentation',
    grantedCapabilities: input.grantedCapabilities ?? [
      'session.read.redacted',
      'window.show'
    ],
    occurredAt: '2026-07-20T09:00:00.200Z'
  });
}

export function buildPairingDenied(clientId: string): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'pairing',
    type: 'pairing:denied',
    clientId,
    occurredAt: '2026-07-20T09:00:00.200Z'
  });
}

export function buildRevokedEvent(): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'event',
    type: 'sdk:revoked',
    eventId: 'evt_revoked_001',
    sequence: 1,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:10.000Z',
    revision: 1,
    payload: { reasonCode: 'admin_revoke' }
  });
}

export function buildSnapshotMessage(revision = 1): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'snapshot',
    type: 'sdk:snapshot',
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:00.300Z',
    revision,
    sections: {
      session: {
        clientId: 'client_test_001',
        grantedCapabilities: ['session.read.redacted', 'window.show'],
        authenticated: true
      },
      registration: { state: 'registered' },
      account: { signedIn: false },
      operator: { connected: false },
      window: { visible: true },
      calls: []
    }
  });
}

export function buildPermissionChanged(
  grantedCapabilities: readonly CapabilityId[]
): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'event',
    type: 'sdk:permission-changed',
    eventId: 'evt_perm_001',
    sequence: 2,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:11.000Z',
    revision: 2,
    payload: { grantedCapabilities: [...grantedCapabilities] }
  });
}

export function findSentType(transport: FakeTransport, type: string): unknown {
  for (const item of transport.sent) {
    try {
      const parsed: unknown = JSON.parse(item);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'type' in parsed &&
        parsed.type === type
      ) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

function replyToCommand(
  transport: FakeTransport,
  commandType: string,
  result: Record<string, unknown>,
  revision = 1
): boolean {
  for (let index = transport.sent.length - 1; index >= 0; index -= 1) {
    const item = transport.sent[index]!;
    try {
      const parsed: unknown = JSON.parse(item);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('type' in parsed) ||
        parsed.type !== commandType ||
        !('requestId' in parsed) ||
        typeof parsed.requestId !== 'string' ||
        !('serverInstanceId' in parsed) ||
        typeof parsed.serverInstanceId !== 'string' ||
        !('sessionEpoch' in parsed) ||
        typeof parsed.sessionEpoch !== 'string'
      ) {
        continue;
      }
      transport.simulateMessage(
        JSON.stringify({
          protocolVersion: 1,
          kind: 'reply',
          ok: true,
          requestId: parsed.requestId,
          commandType,
          serverInstanceId: parsed.serverInstanceId,
          sessionEpoch: parsed.sessionEpoch,
          occurredAt: '2026-07-20T09:00:00.400Z',
          revision,
          result
        })
      );
      return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export function replyToAuthPing(transport: FakeTransport): boolean {
  return replyToCommand(transport, 'sdk:ping', {});
}

/** DI-05 ordering: snapshot wire message, then success reply. */
export function replyToGetSnapshot(
  transport: FakeTransport,
  snapshotBody?: string,
  revision = 13
): boolean {
  const snapshot = snapshotBody ?? buildSnapshotMessage(revision);
  transport.simulateMessage(snapshot);
  return replyToCommand(transport, 'sdk:get-snapshot', { accepted: true }, revision);
}

/** OK reply only — no prior snapshot wire (adversarial / wrong-order). */
export function replyToGetSnapshotReplyOnly(
  transport: FakeTransport,
  revision = 13
): boolean {
  return replyToCommand(
    transport,
    'sdk:get-snapshot',
    { accepted: true },
    revision
  );
}

/** Snapshot wire at one revision, reply claiming another. */
export function replyToGetSnapshotWithMismatch(
  transport: FakeTransport,
  snapshotRevision: number,
  replyRevision: number
): boolean {
  transport.simulateMessage(buildSnapshotMessage(snapshotRevision));
  return replyToCommand(
    transport,
    'sdk:get-snapshot',
    { accepted: true },
    replyRevision
  );
}

export function replyToWindowShow(
  transport: FakeTransport,
  revision = 14
): boolean {
  return replyToCommand(transport, 'window:show', { visible: true }, revision);
}

/** Malformed window success reply (non-boolean visible). */
export function replyToWindowGetStateMalformed(
  transport: FakeTransport,
  revision = 14
): boolean {
  return replyToCommand(
    transport,
    'window:get-state',
    { visible: 'yes' },
    revision
  );
}

export function replyForbidden(
  transport: FakeTransport,
  commandType: string
): boolean {
  for (let index = transport.sent.length - 1; index >= 0; index -= 1) {
    const item = transport.sent[index]!;
    try {
      const parsed: unknown = JSON.parse(item);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('type' in parsed) ||
        parsed.type !== commandType ||
        !('requestId' in parsed) ||
        typeof parsed.requestId !== 'string' ||
        !('serverInstanceId' in parsed) ||
        typeof parsed.serverInstanceId !== 'string' ||
        !('sessionEpoch' in parsed) ||
        typeof parsed.sessionEpoch !== 'string'
      ) {
        continue;
      }
      transport.simulateMessage(
        JSON.stringify({
          protocolVersion: 1,
          kind: 'reply',
          ok: false,
          requestId: parsed.requestId,
          commandType,
          serverInstanceId: parsed.serverInstanceId,
          sessionEpoch: parsed.sessionEpoch,
          occurredAt: '2026-07-20T09:00:00.400Z',
          error: { code: 'forbidden', retryable: false }
        })
      );
      return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export function buildCallIncomingEvent(sequence: number, revision = 13): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'event',
    type: 'call:incoming',
    eventId: `evt_call_${sequence}`,
    sequence,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:05.000Z',
    revision,
    payload: {
      callId: 'call_test_001',
      state: 'ringing',
      direction: 'inbound',
      remoteNumber: '+1******7890',
      remoteDisplayName: 'A***'
    }
  });
}

export function buildWindowVisibilityEvent(
  sequence: number,
  visible: boolean,
  revision = 14
): string {
  return JSON.stringify({
    protocolVersion: 1,
    kind: 'event',
    type: 'window:visibility-changed',
    eventId: `evt_win_${sequence}`,
    sequence,
    serverInstanceId: 'srv_test_001',
    sessionEpoch: 'epoch_test_001',
    occurredAt: '2026-07-20T09:00:06.000Z',
    revision,
    payload: { visible }
  });
}
