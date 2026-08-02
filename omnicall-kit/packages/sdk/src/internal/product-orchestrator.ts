/**
 * Product orchestration: snapshot, events, window, calls, operator, account.
 */

import type { CapabilityId, SnapshotMessage } from '@softomnitel/omnicall-protocol';

import {
  createAccountActivateCommandApi,
  type AccountActivateCommandApi
} from './account-activate-commands.js';
import {
  createAccountLogoutCommandApi,
  type AccountLogoutCommandApi
} from './account-logout-commands.js';
import {
  createCallCommandApi,
  type CallCommandApi,
  type CallMutationResult
} from './call-commands.js';
import type { ConnectionSession } from './connection-session.js';
import type { DiagnosticsSink } from './diagnostics.js';
import { createEventSubscriptionHub } from './event-subscription.js';
import { createLatestKnownRevisionTracker } from './latest-known-revision.js';
import {
  createOperatorCommandApi,
  type OperatorCommandApi
} from './operator-commands.js';
import {
  guardCapability,
  guardReady,
  mapPendingFailure,
  mapReplyFailure,
  observeReplyRevision,
  requireWireIdentity
} from './product-commands.js';
import { parseProductInbound } from './product-inbound.js';
import { buildGetSnapshotBody } from './product-wire.js';
import type { OmniCallEvent, PublicEventType } from './public-event-map.js';
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
import {
  createWindowCommandApi,
  type WindowStateResult
} from './window-commands.js';

export type { CallMutationResult, WindowStateResult };

export type ProductOrchestrator = {
  readonly onUnhandledMessage: (raw: string) => boolean;
  readonly invalidate: () => void;
  readonly getCachedSnapshot: () => SnapshotMessage | undefined;
  readonly getRevision: () => number | undefined;
  readonly getSnapshot: () => Promise<SnapshotMessage>;
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<OmniCallEvent, { type: T }>) => void
  ) => () => void;
  readonly showWindow: () => Promise<WindowStateResult>;
  readonly hideWindow: (input: {
    readonly expectedRevision: number;
  }) => Promise<WindowStateResult>;
  readonly getWindowState: () => Promise<WindowStateResult>;
  readonly originateCall: CallCommandApi['originateCall'];
  readonly controlCall: CallCommandApi['controlCall'];
  readonly sendDtmf: CallCommandApi['sendDtmf'];
  readonly getOperatorReasons: OperatorCommandApi['getReasons'];
  readonly changeOperatorStatus: OperatorCommandApi['changeStatus'];
  readonly finishOperatorAppeal: OperatorCommandApi['finishAppeal'];
  readonly logout: AccountLogoutCommandApi['logout'];
  readonly activateProfile: AccountActivateCommandApi['activateProfile'];
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
  const revisionTracker = createLatestKnownRevisionTracker({
    getActiveIdentity: () => deps.connection.getWireIdentity()
  });
  const waitTimeoutMs = deps.snapshotWaitTimeoutMs ?? 5_000;
  let resyncInFlight = false;
  let pendingAcquisitions: SnapshotAcquisition[] = [];
  const commandDeps = {
    connection: deps.connection,
    scheduler: deps.scheduler,
    getGrantedCapabilities: deps.getGrantedCapabilities,
    observeWireRevision: revisionTracker.observe
  };
  const calls = createCallCommandApi(commandDeps);
  const windowApi = createWindowCommandApi(commandDeps);
  const operator = createOperatorCommandApi(commandDeps);
  const accountLogout = createAccountLogoutCommandApi(commandDeps);
  const accountActivate = createAccountActivateCommandApi(commandDeps);

  const removeAcquisition = (acquisition: SnapshotAcquisition): void => {
    pendingAcquisitions = pendingAcquisitions.filter(
      (item) => item !== acquisition
    );
  };

  const invalidate = (): void => {
    cache.clear();
    revisionTracker.clear();
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

  const observeInboundRevision = (message: {
    readonly revision: number;
    readonly serverInstanceId: string;
    readonly sessionEpoch: string;
  }): void => {
    revisionTracker.observe({
      revision: message.revision,
      serverInstanceId: message.serverInstanceId,
      sessionEpoch: message.sessionEpoch
    });
  };

  const matchesActiveIdentity = (message: {
    readonly serverInstanceId: string;
    readonly sessionEpoch: string;
  }): boolean => {
    const active = deps.connection.getWireIdentity();
    return (
      active !== undefined &&
      active.serverInstanceId === message.serverInstanceId &&
      active.sessionEpoch === message.sessionEpoch
    );
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
        observeReplyRevision(revisionTracker.observe, result);
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
    // A stale socket/server message must not affect cache, sequencing, resync,
    // revision, or public listeners.
    if (!matchesActiveIdentity(inbound.message)) {
      return false;
    }
    if (inbound.kind === 'snapshot') {
      cache.set(inbound.message);
      observeInboundRevision(inbound.message);
      notifyMatchingWaiters(inbound.message);
      return true;
    }
    observeInboundRevision(inbound.message);
    if (
      inbound.message.type === 'sdk:permission-changed' ||
      inbound.message.type === 'sdk:revoked'
    ) {
      // Auth lifecycle events share the per-connection wire sequence with product
      // events. Advance hub sequence (no public listeners) so the next public
      // event does not false-trigger event.sequence_gap / snapshot storms.
      hub.handleEvent(inbound.message, deps.connection.getState());
      if (inbound.message.type === 'sdk:revoked') {
        invalidate();
      }
      return false;
    }
    hub.handleEvent(inbound.message, deps.connection.getState());
    return true;
  };

  return {
    onUnhandledMessage,
    invalidate,
    getCachedSnapshot: () => cache.get(),
    getRevision: () => revisionTracker.get(),
    getSnapshot: () => getSnapshotInternal(),
    subscribe: hub.subscribe,
    showWindow: windowApi.showWindow,
    hideWindow: windowApi.hideWindow,
    getWindowState: windowApi.getWindowState,
    originateCall: calls.originateCall,
    controlCall: calls.controlCall,
    sendDtmf: calls.sendDtmf,
    getOperatorReasons: operator.getReasons,
    changeOperatorStatus: operator.changeStatus,
    finishOperatorAppeal: operator.finishAppeal,
    logout: accountLogout.logout,
    activateProfile: accountActivate.activateProfile,
    dispose: () => {
      invalidate();
      hub.clearListeners();
    }
  };
}
