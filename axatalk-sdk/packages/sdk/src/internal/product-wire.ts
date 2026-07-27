/**
 * Product command wire builders (SDK-05 read path + window.show).
 */

import { PROTOCOL_MAJOR } from '@axata/axatalk-protocol';

import { isoNow } from './auth-wire.js';

export function buildGetSnapshotBody(input: {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'sdk:get-snapshot',
    requestId: input.requestId,
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    occurredAt: isoNow(input.occurredAtMs),
    payload: {}
  });
}

export function buildWindowShowBody(input: {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'window:show',
    requestId: input.requestId,
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    occurredAt: isoNow(input.occurredAtMs),
    payload: {}
  });
}

export function buildWindowGetStateBody(input: {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'window:get-state',
    requestId: input.requestId,
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    occurredAt: isoNow(input.occurredAtMs),
    payload: {}
  });
}

export function buildWindowHideBody(input: {
  readonly requestId: string;
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly occurredAtMs: number;
  readonly expectedRevision: number;
}): string {
  return JSON.stringify({
    protocolVersion: PROTOCOL_MAJOR,
    kind: 'command',
    type: 'window:hide',
    requestId: input.requestId,
    serverInstanceId: input.serverInstanceId,
    sessionEpoch: input.sessionEpoch,
    occurredAt: isoNow(input.occurredAtMs),
    payload: { expectedRevision: input.expectedRevision }
  });
}
