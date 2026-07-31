/**
 * OmniCallClient factory — read (SDK-05), calls (SDK-06), operator/logout (SDK-07),
 * privileged saved-profile activate (SDK-08).
 */

import { createAuthOrchestrator } from '../internal/auth-orchestrator.js';
import {
  OmniCallClientError,
  isOmniCallClientError
} from '../internal/client-errors.js';
import { isOriginBlockedError } from '../internal/origin-policy-errors.js';
import { createBrowserWebSocketTransport } from '../internal/browser-websocket-transport.js';
import { createConnectionSession } from '../internal/connection-session.js';
import { createProductOrchestrator } from '../internal/product-orchestrator.js';
import {
  createBrowserJitterSource,
  createBrowserScheduler
} from '../internal/scheduler.js';
import {
  PUBLIC_EVENT_TYPES,
  type OmniCallEvent,
  type OmniCallEventOf,
  type PublicEventType
} from '../internal/public-event-map.js';
import type { PairingRequiredInfo } from './auth-client.js';
import type {
  OmniCallClient,
  OmniCallClientOptions
} from './omnicall-client-api.js';

export type { OmniCallEvent, OmniCallEventOf, PublicEventType };
export { OmniCallClientError, isOmniCallClientError, isOriginBlockedError, PUBLIC_EVENT_TYPES };
export type {
  ActivateProfileMode,
  ActivateProfileResult
} from '../internal/account-activate-commands.js';
export type { LogoutResult } from '../internal/account-logout-commands.js';
export type {
  OperatorFinishAppealResult,
  OperatorReason,
  OperatorReasonsResult,
  OperatorStatusChangeKind,
  OperatorStatusChangeResult
} from '../internal/operator-commands.js';
export type {
  OmniCallAccountApi,
  OmniCallCallsApi,
  OmniCallClient,
  OmniCallClientOptions,
  OmniCallOperatorApi,
  OmniCallWindowApi,
  CallMutationResult
} from './omnicall-client-api.js';
export {
  isConflictError,
  isInteractionRequiredError,
  isOperationFailedError,
  readConflictErrorDetails,
  readInteractionRequiredDetails,
  readOperationFailedDetails,
  type ConflictErrorDetails,
  type InteractionRequiredDetails,
  type OperationFailedDetails
} from '../internal/client-error-details.js';
export type {
  CapabilityId,
  ProtocolErrorCode,
  PublicOperatorStatus,
  SnapshotCallSummary,
  SnapshotMessage,
  SnapshotSections,
  WireJsonObject
} from './protocol-reexports.js';

/**
 * Create an OmniCall client. Does not connect, pair, auth, or fetch.
 * @public
 */
export function createOmniCallClient(
  options: OmniCallClientOptions
): OmniCallClient {
  const pairingListeners = new Set<(info: PairingRequiredInfo) => void>();
  const orchestratorHolder: {
    current: ReturnType<typeof createAuthOrchestrator> | undefined;
  } = { current: undefined };
  const productHolder: {
    current: ReturnType<typeof createProductOrchestrator> | undefined;
  } = { current: undefined };

  const transportFactory =
    options.transportFactory ?? createBrowserWebSocketTransport;
  const scheduler = options.scheduler ?? createBrowserScheduler();
  const jitter = options.jitter ?? createBrowserJitterSource();

  const connection = createConnectionSession({
    url: options.url,
    transportFactory,
    scheduler,
    jitter,
    ...(options.diagnostics !== undefined
      ? { diagnostics: options.diagnostics }
      : {}),
    ...(options.defaultRequestTimeoutMs !== undefined
      ? { defaultRequestTimeoutMs: options.defaultRequestTimeoutMs }
      : {}),
    ...(options.reconnect !== undefined ? { reconnect: options.reconnect } : {}),
    ...(options.heartbeat !== undefined ? { heartbeat: options.heartbeat } : {}),
    onHandshaking: () => {
      orchestratorHolder.current?.onHandshaking();
    },
    onUnhandledMessage: (data) => {
      const productHandled =
        productHolder.current?.onUnhandledMessage(data) === true;
      if (!productHandled) {
        orchestratorHolder.current?.onUnhandledMessage(data);
      }
    }
  });

  const orchestrator = createAuthOrchestrator({
    connection,
    origin: options.origin,
    application: options.application,
    sdkVersion: options.sdkVersion,
    requestedProfile: options.requestedProfile,
    requestedCapabilities: options.requestedCapabilities ?? [],
    keyStore: options.keyStore,
    scheduler,
    ...(options.diagnostics !== undefined
      ? { diagnostics: options.diagnostics }
      : {}),
    onPairingRequired: (info) => {
      for (const listener of pairingListeners) {
        listener(info);
      }
    }
  });
  orchestratorHolder.current = orchestrator;

  const product = createProductOrchestrator({
    connection,
    scheduler,
    getGrantedCapabilities: () => orchestrator.getGrantedCapabilities(),
    snapshotWaitTimeoutMs: options.defaultRequestTimeoutMs ?? 5_000,
    ...(options.diagnostics !== undefined
      ? { diagnostics: options.diagnostics }
      : {})
  });
  productHolder.current = product;

  connection.onStateChange((state) => {
    if (state === 'reconnecting' || state === 'revoked' || state === 'closed') {
      product.invalidate();
    }
    if (state === 'reconnecting') {
      orchestrator.clearSession();
    }
    if (state === 'ready') {
      void product.getSnapshot().catch(() => undefined);
    }
  });

  return {
    getState: () => connection.getState(),
    getGrantedCapabilities: () => orchestrator.getGrantedCapabilities(),
    getSession: () => {
      const session = orchestrator.getSession();
      if (session === undefined) {
        return undefined;
      }
      return Object.freeze({
        serverInstanceId: session.serverInstanceId,
        sessionEpoch: session.sessionEpoch,
        clientId: session.clientId,
        profile: session.profile,
        grantedCapabilities: session.grantedCapabilities
      });
    },
    preauthDropCount: () => orchestrator.preauthDropCount(),
    connect: async () => {
      await orchestrator.prepareConnect();
      connection.connect();
    },
    disconnect: () => {
      connection.disconnect();
      orchestrator.clearSession();
      product.invalidate();
    },
    onStateChange: (listener) => connection.onStateChange(listener),
    onPairingRequired: (listener) => {
      pairingListeners.add(listener);
      return () => {
        pairingListeners.delete(listener);
      };
    },
    waitUntil: (predicate, timeoutMs = 5_000) =>
      new Promise((resolve, reject) => {
        if (predicate(connection.getState())) {
          resolve(connection.getState());
          return;
        }
        const timer = scheduler.setTimeout(() => {
          unsubscribe();
          reject(new Error('waitUntil timeout'));
        }, timeoutMs);
        const unsubscribe = connection.onStateChange((next) => {
          if (predicate(next)) {
            timer.clear();
            unsubscribe();
            resolve(next);
          }
        });
      }),
    getConnectError: () => connection.getConnectError(),
    getSnapshot: () => product.getSnapshot(),
    getCachedSnapshot: () => product.getCachedSnapshot(),
    getRevision: () => product.getRevision(),
    subscribe: product.subscribe,
    window: Object.freeze({
      show: () => product.showWindow(),
      hide: (input) => product.hideWindow(input),
      getState: () => product.getWindowState()
    }),
    calls: Object.freeze({
      originate: (input) => product.originateCall(input),
      answer: (input) => product.controlCall('call:answer', input),
      reject: (input) => product.controlCall('call:reject', input),
      hangup: (input) => product.controlCall('call:hangup', input),
      hold: (input) => product.controlCall('call:hold', input),
      resume: (input) => product.controlCall('call:resume', input),
      mute: (input) => product.controlCall('call:mute', input),
      unmute: (input) => product.controlCall('call:unmute', input),
      sendDtmf: (input) => product.sendDtmf(input)
    }),
    operator: Object.freeze({
      getReasons: () => product.getOperatorReasons(),
      changeStatus: (input) => product.changeOperatorStatus(input),
      finishAppeal: (input) => product.finishOperatorAppeal(input)
    }),
    account: Object.freeze({
      logout: (input) => product.logout(input),
      activateProfile: (input) => product.activateProfile(input)
    })
  };
}
