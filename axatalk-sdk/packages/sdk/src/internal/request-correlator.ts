/**
 * Request/reply correlation with timeout and disconnect cleanup.
 * Never replays outbound requests after abort or disconnect.
 */

import type { ProtocolErrorCode, ReplyMessage } from '@axatalk/protocol';
import { validateWireMessage } from '@axatalk/protocol';

import type { DiagnosticsSink } from './diagnostics.js';
import type { ConnectionState } from './connection-state.js';
import type { Scheduler, TimerHandle } from './scheduler.js';

export type PendingRequestFailure = {
  readonly ok: false;
  readonly errorCode: ProtocolErrorCode;
  readonly reason: 'timeout' | 'aborted' | 'disconnect' | 'invalid_reply';
};

export type PendingRequestSuccess = {
  readonly ok: true;
  readonly reply: ReplyMessage;
};

export type PendingRequestResult = PendingRequestSuccess | PendingRequestFailure;

export type CorrelatedRequest = {
  readonly requestId: string;
  readonly commandType: string;
  readonly mutation: boolean;
};

type PendingEntry = {
  readonly request: CorrelatedRequest;
  readonly startedAt: number;
  readonly timer: TimerHandle;
  readonly resolve: (result: PendingRequestResult) => void;
  readonly abortUnsubscribe: (() => void) | undefined;
};

export type RequestCorrelator = {
  readonly track: (
    request: CorrelatedRequest,
    options: {
      readonly timeoutMs: number;
      readonly signal?: AbortSignal;
      readonly connectionState: ConnectionState;
    }
  ) => Promise<PendingRequestResult>;
  readonly handleInbound: (raw: string, connectionState: ConnectionState) => boolean;
  readonly rejectAll: (
    reason: 'aborted' | 'disconnect',
    connectionState: ConnectionState
  ) => void;
  readonly pendingCount: () => number;
  /** Count of mutation sends observed; never stores payloads/PII. */
  readonly mutationSendCount: () => number;
  readonly clearMutationLedger: () => void;
};

export function createRequestCorrelator(deps: {
  readonly scheduler: Scheduler;
  readonly diagnostics?: DiagnosticsSink;
}): RequestCorrelator {
  const pending = new Map<string, PendingEntry>();
  let mutationSendCount = 0;

  const finish = (
    entry: PendingEntry,
    result: PendingRequestResult,
    connectionState: ConnectionState
  ): void => {
    entry.timer.clear();
    entry.abortUnsubscribe?.();
    pending.delete(entry.request.requestId);
    const durationMs = deps.scheduler.now() - entry.startedAt;
    deps.diagnostics?.emit({
      level: result.ok ? 'debug' : 'warn',
      code: result.ok ? 'request.completed' : 'request.failed',
      connectionState,
      requestId: entry.request.requestId,
      commandType: entry.request.commandType,
      durationMs,
      result: mapResult(result),
      ...(result.ok ? {} : { errorCode: result.errorCode })
    });
    entry.resolve(result);
  };

  return {
    track: (request, options) => {
      if (pending.has(request.requestId)) {
        return Promise.resolve({
          ok: false,
          errorCode: 'conflict',
          reason: 'invalid_reply'
        });
      }
      if (request.mutation) {
        mutationSendCount += 1;
      }
      return new Promise<PendingRequestResult>((resolve) => {
        const timer = deps.scheduler.setTimeout(() => {
          const entry = pending.get(request.requestId);
          if (entry === undefined) {
            return;
          }
          finish(
            entry,
            { ok: false, errorCode: 'timeout', reason: 'timeout' },
            options.connectionState
          );
        }, options.timeoutMs);

        let abortUnsubscribe: (() => void) | undefined;
        if (options.signal !== undefined) {
          const onAbort = (): void => {
            const entry = pending.get(request.requestId);
            if (entry === undefined) {
              return;
            }
            finish(
              entry,
              { ok: false, errorCode: 'operation_failed', reason: 'aborted' },
              options.connectionState
            );
          };
          if (options.signal.aborted) {
            timer.clear();
            resolve({
              ok: false,
              errorCode: 'operation_failed',
              reason: 'aborted'
            });
            return;
          }
          options.signal.addEventListener('abort', onAbort, { once: true });
          abortUnsubscribe = () => {
            options.signal?.removeEventListener('abort', onAbort);
          };
        }

        pending.set(request.requestId, {
          request,
          startedAt: deps.scheduler.now(),
          timer,
          resolve,
          abortUnsubscribe
        });
      });
    },
    handleInbound: (raw, connectionState) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        return false;
      }
      const validated = validateWireMessage(parsed);
      if (!validated.success) {
        return false;
      }
      const message = validated.data;
      if (message.kind !== 'reply') {
        return false;
      }
      const entry = pending.get(message.requestId);
      if (entry === undefined) {
        return false;
      }
      finish(entry, { ok: true, reply: message }, connectionState);
      return true;
    },
    rejectAll: (reason, connectionState) => {
      const entries = [...pending.values()];
      for (const entry of entries) {
        finish(
          entry,
          {
            ok: false,
            errorCode: 'operation_failed',
            reason
          },
          connectionState
        );
      }
    },
    pendingCount: () => pending.size,
    mutationSendCount: () => mutationSendCount,
    clearMutationLedger: () => {
      mutationSendCount = 0;
    }
  };
}

function mapResult(
  result: PendingRequestResult
): 'ok' | 'error' | 'timeout' | 'aborted' {
  if (result.ok) {
    return 'ok';
  }
  if (result.reason === 'timeout') {
    return 'timeout';
  }
  if (result.reason === 'aborted') {
    return 'aborted';
  }
  return 'error';
}
