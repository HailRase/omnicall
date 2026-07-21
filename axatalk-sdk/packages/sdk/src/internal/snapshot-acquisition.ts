/**
 * Pending getSnapshot acquisitions: revision-bound resolve + typed reject.
 */

import type { SnapshotMessage } from '@axata/axatalk-protocol';

import {
  createClientError,
  type AxatalkClientError
} from './client-errors.js';
import type { TimerHandle } from './scheduler.js';

export type SnapshotAcquisition = {
  readonly requestId: string;
  expectedRevision: number | undefined;
  settled: boolean;
  timer: TimerHandle | undefined;
  readonly resolve: (value: SnapshotMessage) => void;
  readonly reject: (error: AxatalkClientError) => void;
};

export function matchSnapshotRevision(
  snapshot: SnapshotMessage,
  revision: number
): boolean {
  return snapshot.revision === revision;
}

export function rejectAllAcquisitions(
  acquisitions: readonly SnapshotAcquisition[],
  error: AxatalkClientError
): void {
  for (const acquisition of acquisitions) {
    settleReject(acquisition, error);
  }
}

export function settleResolve(
  acquisition: SnapshotAcquisition,
  snapshot: SnapshotMessage
): void {
  if (acquisition.settled) {
    return;
  }
  acquisition.settled = true;
  acquisition.timer?.clear();
  acquisition.timer = undefined;
  acquisition.resolve(snapshot);
}

export function settleReject(
  acquisition: SnapshotAcquisition,
  error: AxatalkClientError
): void {
  if (acquisition.settled) {
    return;
  }
  acquisition.settled = true;
  acquisition.timer?.clear();
  acquisition.timer = undefined;
  acquisition.reject(error);
}

export function invalidateErrorForState(
  state: string
): AxatalkClientError {
  if (state === 'revoked') {
    return createClientError({ code: 'revoked', retryable: false });
  }
  return createClientError({ code: 'not_ready', retryable: true });
}

export function timeoutSnapshotError(): AxatalkClientError {
  return createClientError({ code: 'timeout', retryable: true });
}
