/**
 * Capability-gated product command helpers (snapshot / window).
 */

import type { CapabilityId, ProtocolErrorCode } from '@axatalk/protocol';

import { createClientError, type AxatalkClientError } from './client-errors.js';
import type { ConnectionSession } from './connection-session.js';
import type { PendingRequestResult } from './request-correlator.js';

export function guardReady(
  connection: ConnectionSession
): AxatalkClientError | undefined {
  if (connection.getState() !== 'ready') {
    return createClientError({ code: 'not_ready', retryable: true });
  }
  return undefined;
}

export function guardCapability(
  granted: readonly CapabilityId[],
  capability: CapabilityId
): AxatalkClientError | undefined {
  if (!granted.includes(capability)) {
    return createClientError({ code: 'forbidden', retryable: false });
  }
  return undefined;
}

export function requireWireIdentity(
  connection: ConnectionSession
):
  | { readonly serverInstanceId: string; readonly sessionEpoch: string }
  | AxatalkClientError {
  const identity = connection.getWireIdentity();
  if (identity === undefined) {
    return createClientError({ code: 'unauthenticated', retryable: true });
  }
  return identity;
}

export function mapPendingFailure(result: {
  readonly ok: false;
  readonly errorCode: ProtocolErrorCode;
}): AxatalkClientError {
  return createClientError({
    code: result.errorCode,
    retryable:
      result.errorCode === 'timeout' ||
      result.errorCode === 'not_ready' ||
      result.errorCode === 'rate_limited'
  });
}

export function mapReplyFailure(result: PendingRequestResult): AxatalkClientError {
  if (!result.ok) {
    return mapPendingFailure(result);
  }
  if (result.reply.ok) {
    return createClientError({ code: 'operation_failed', retryable: false });
  }
  return createClientError({
    code: result.reply.error.code,
    retryable: result.reply.error.retryable,
    ...(result.reply.error.currentRevision !== undefined
      ? { currentRevision: result.reply.error.currentRevision }
      : {})
  });
}

export function readWindowState(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): { readonly visible: boolean; readonly revision: number } {
  const visible = reply.result['visible'];
  if (typeof visible !== 'boolean') {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    visible,
    revision: reply.revision
  };
}

export function readCallMutationResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): { readonly callId: string; readonly revision: number } {
  const callId = reply.result['callId'];
  if (typeof callId !== 'string' || callId.length === 0) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    callId,
    revision: reply.revision
  };
}
