/**
 * Read-only product orchestration: snapshot cache, events, window.show.
 */

import type { CapabilityId, SnapshotMessage } from '@axatalk/protocol';

import type { ConnectionSession } from './connection-session.js';
import type { DiagnosticsSink } from './diagnostics.js';
import { createEventSubscriptionHub } from './event-subscription.js';
import {
  guardCapability,
  guardReady,
  mapPendingFailure,
  mapReplyFailure,
  readWindowState,
  requireWireIdentity
} from './product-commands.js';
import { parseProductInbound } from './product-inbound.js';
import {
  buildGetSnapshotBody,
  buildWindowGetStateBody,
  buildWindowShowBody
} from './product-wire.js';
import type { AxatalkEvent, PublicEventType } from './public-event-map.js';
import type { Scheduler } from './scheduler.js';
import {
  invalidateErrorForState,
  matchSnapshotRevision,
  rejectAllAcquisitions,
  settleReject,
  settleResolve,
  timeoutSnapshotError,
  type SnapshotAcquisition
} from './snapshot-acquisition.js';
import { createSnapshotCache } from './snapshot-cache.js';

export type WindowStateResult = {
  readonly visible: boolean;
  readonly revision: number;
};

export type ProductOrchestrator = {
  readonly onUnhandledMessage: (raw: string) => boolean;
  readonly invalidate: () => void;
  readonly getCachedSnapshot: () => SnapshotMessage | undefined;
  readonly getRevision: () => number | undefined;
  readonly getSnapshot: () => Promise<SnapshotMessage>;
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<AxatalkEvent, { type: T }>) => void
  ) => () => void;
  readonly showWindow: () => Promise<WindowStateResult>;
  readonly getWindowState: () => Promise<WindowStateResult>;
  readonly dispose: () => void;
};

export function createProductOrchestrator(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
  readonly diagnostics?: DiagnosticsSink;
  readonly snapshotWaitTimeoutMs?: number;
}): ProductOrchestrator {
  const cache = createSnapshotCache();
  const waitTimeoutMs = deps.snapshotWaitTimeoutMs ?? 5_000;
  let resyncInFlight = false;
  let pendingAcquisitions: SnapshotAcquisition[] = [];

  const removeAcquisition = (acquisition: SnapshotAcquisition): void => {
    pendingAcquisitions = pendingAcquisitions.filter(
      (item) => item !== acquisition
    );
  };

  const invalidate = (): void => {
    cache.clear();
    hub.clearSequence();
    const error = invalidateErrorForState(deps.connection.getState());
    const waiters = pendingAcquisitions;
    pendingAcquisitions = [];
    rejectAllAcquisitions(waiters, error);
  };

  const notifyMatchingWaiters = (snapshot: SnapshotMessage): void => {
    const remaining: SnapshotAcquisition[] = [];
    for (const acquisition of pendingAcquisitions) {
      if (
        acquisition.expectedRevision !== undefined &&
        matchSnapshotRevision(snapshot, acquisition.expectedRevision)
      ) {
        settleResolve(acquisition, snapshot);
      } else {
        remaining.push(acquisition);
      }
    }
    pendingAcquisitions = remaining;
  };

  const getSnapshotInternal = (): Promise<SnapshotMessage> => {
    const notReady = guardReady(deps.connection);
    if (notReady !== undefined) {
      return Promise.reject(notReady);
    }
    const missingCap = guardCapability(
      deps.getGrantedCapabilities(),
      'session.read.redacted'
    );
    if (missingCap !== undefined) {
      return Promise.reject(missingCap);
    }
    const identity = requireWireIdentity(deps.connection);
    if ('code' in identity) {
      return Promise.reject(identity);
    }

    const requestId = crypto.randomUUID();
    return new Promise<SnapshotMessage>((resolve, reject) => {
      const acquisition: SnapshotAcquisition = {
        requestId,
        expectedRevision: undefined,
        settled: false,
        timer: undefined,
        resolve,
        reject
      };
      pendingAcquisitions.push(acquisition);

      void (async () => {
        const result = await deps.connection.request({
          requestId,
          commandType: 'sdk:get-snapshot',
          body: buildGetSnapshotBody({
            requestId,
            serverInstanceId: identity.serverInstanceId,
            sessionEpoch: identity.sessionEpoch,
            occurredAtMs: deps.scheduler.now()
          })
        });
        if (acquisition.settled) {
          return;
        }
        if (!result.ok) {
          removeAcquisition(acquisition);
          settleReject(acquisition, mapPendingFailure(result));
          return;
        }
        if (!result.reply.ok) {
          removeAcquisition(acquisition);
          settleReject(acquisition, mapReplyFailure(result));
          return;
        }

        const replyRevision = result.reply.revision;
        acquisition.expectedRevision = replyRevision;
        const cached = cache.get();
        if (
          cached !== undefined &&
          matchSnapshotRevision(cached, replyRevision)
        ) {
          removeAcquisition(acquisition);
          settleResolve(acquisition, cached);
          return;
        }

        acquisition.timer = deps.scheduler.setTimeout(() => {
          removeAcquisition(acquisition);
          settleReject(acquisition, timeoutSnapshotError());
        }, waitTimeoutMs);
      })();
    });
  };

  const requestResync = (): void => {
    if (resyncInFlight) {
      return;
    }
    resyncInFlight = true;
    void getSnapshotInternal()
      .catch(() => undefined)
      .finally(() => {
        resyncInFlight = false;
      });
  };

  const hub = createEventSubscriptionHub({
    ...(deps.diagnostics !== undefined
      ? { diagnostics: deps.diagnostics }
      : {}),
    onSequenceGap: () => {
      requestResync();
    }
  });

  const onUnhandledMessage = (raw: string): boolean => {
    if (deps.connection.getState() !== 'ready') {
      return false;
    }
    const inbound = parseProductInbound(raw);
    if (inbound.kind === 'ignored') {
      return false;
    }
    if (inbound.kind === 'snapshot') {
      cache.set(inbound.message);
      notifyMatchingWaiters(inbound.message);
      return true;
    }
    if (
      inbound.message.type === 'sdk:permission-changed' ||
      inbound.message.type === 'sdk:revoked'
    ) {
      if (inbound.message.type === 'sdk:revoked') {
        invalidate();
      }
      return false;
    }
    hub.handleEvent(inbound.message, deps.connection.getState());
    return true;
  };

  const runWindowCommand = async (
    commandType: 'window:show' | 'window:get-state'
  ): Promise<WindowStateResult> => {
    const notReady = guardReady(deps.connection);
    if (notReady !== undefined) {
      return Promise.reject(notReady);
    }
    const missingCap = guardCapability(
      deps.getGrantedCapabilities(),
      'window.show'
    );
    if (missingCap !== undefined) {
      return Promise.reject(missingCap);
    }
    const identity = requireWireIdentity(deps.connection);
    if ('code' in identity) {
      return Promise.reject(identity);
    }
    const requestId = crypto.randomUUID();
    const body =
      commandType === 'window:show'
        ? buildWindowShowBody({
            requestId,
            serverInstanceId: identity.serverInstanceId,
            sessionEpoch: identity.sessionEpoch,
            occurredAtMs: deps.scheduler.now()
          })
        : buildWindowGetStateBody({
            requestId,
            serverInstanceId: identity.serverInstanceId,
            sessionEpoch: identity.sessionEpoch,
            occurredAtMs: deps.scheduler.now()
          });
    const result = await deps.connection.request({
      requestId,
      commandType,
      body
    });
    if (!result.ok || !result.reply.ok) {
      return Promise.reject(mapReplyFailure(result));
    }
    return readWindowState(result.reply);
  };

  return {
    onUnhandledMessage,
    invalidate,
    getCachedSnapshot: () => cache.get(),
    getRevision: () => cache.getRevision(),
    getSnapshot: () => getSnapshotInternal(),
    subscribe: hub.subscribe,
    showWindow: () => runWindowCommand('window:show'),
    getWindowState: () => runWindowCommand('window:get-state'),
    dispose: () => {
      invalidate();
      hub.clearListeners();
    }
  };
}
