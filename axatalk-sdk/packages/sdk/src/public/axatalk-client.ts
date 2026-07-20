/**
 * AxatalkClient — read path (SDK-05) + capability-gated call mutations (SDK-06).
 */

import type { CapabilityId, SnapshotMessage } from '@axatalk/protocol';

import { createAuthOrchestrator } from '../internal/auth-orchestrator.js';
import {
  AxatalkClientError,
  isAxatalkClientError
} from '../internal/client-errors.js';
import { createConnectionSession } from '../internal/connection-session.js';
import type { ConnectionState } from '../internal/connection-state.js';
import { createProductOrchestrator } from '../internal/product-orchestrator.js';
import {
  PUBLIC_EVENT_TYPES,
  type AxatalkEvent,
  type PublicEventType
} from '../internal/public-event-map.js';
import type {
  AuthClientOptions,
  AuthSessionSnapshot,
  PairingRequiredInfo
} from './auth-client.js';

export type { AxatalkEvent, PublicEventType };
export { AxatalkClientError, isAxatalkClientError, PUBLIC_EVENT_TYPES };

/**
 * Options for {@link createAxatalkClient}. Constructor has no network side effects.
 * @public
 */
export type AxatalkClientOptions = AuthClientOptions;

/**
 * Typed success for call mutations. `revision` is the next expectedRevision.
 * @public
 */
export type CallMutationResult = {
  readonly callId: string;
  readonly revision: number;
};

/**
 * Window namespace (show only; hide is never a successful product method).
 * @public
 */
export type AxatalkWindowApi = {
  readonly show: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
  readonly getState: () => Promise<{
    readonly visible: boolean;
    readonly revision: number;
  }>;
};

/**
 * Call mutation namespace. Every method requires explicit `expectedRevision`
 * (use {@link AxatalkClient.getRevision} / fresh {@link AxatalkClient.getSnapshot}
 * after reconnect — never auto-retry on `stale_state`).
 * @public
 */
export type AxatalkCallsApi = {
  readonly originate: (input: {
    readonly destination: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly answer: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly reject: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly hangup: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly hold: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly resume: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly mute: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly unmute: (input: {
    readonly callId: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly sendDtmf: (input: {
    readonly callId: string;
    readonly digits: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
};

/**
 * Axatalk browser client. No operator/account mutation methods (SDK-07/08).
 * @public
 */
export type AxatalkClient = {
  readonly getState: () => ConnectionState;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
  readonly getSession: () => AuthSessionSnapshot | undefined;
  readonly preauthDropCount: () => number;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly onStateChange: (
    listener: (state: ConnectionState) => void
  ) => () => void;
  readonly onPairingRequired: (
    listener: (info: PairingRequiredInfo) => void
  ) => () => void;
  readonly waitUntil: (
    predicate: (state: ConnectionState) => boolean,
    timeoutMs?: number
  ) => Promise<ConnectionState>;
  /** Request a fresh redacted snapshot (`sdk:get-snapshot`). */
  readonly getSnapshot: () => Promise<SnapshotMessage>;
  /** Last cached snapshot, if any (undefined after invalidate/reconnect). */
  readonly getCachedSnapshot: () => SnapshotMessage | undefined;
  readonly getRevision: () => number | undefined;
  readonly subscribe: <T extends PublicEventType>(
    type: T,
    listener: (event: Extract<AxatalkEvent, { type: T }>) => void
  ) => () => void;
  readonly window: AxatalkWindowApi;
  readonly calls: AxatalkCallsApi;
};

/**
 * Create an Axatalk client. Does not connect, pair, auth, or fetch.
 * @public
 */
export function createAxatalkClient(
  options: AxatalkClientOptions
): AxatalkClient {
  const pairingListeners = new Set<(info: PairingRequiredInfo) => void>();
  const orchestratorHolder: {
    current: ReturnType<typeof createAuthOrchestrator> | undefined;
  } = { current: undefined };
  const productHolder: {
    current: ReturnType<typeof createProductOrchestrator> | undefined;
  } = { current: undefined };

  const connection = createConnectionSession({
    url: options.url,
    transportFactory: options.transportFactory,
    scheduler: options.scheduler,
    jitter: options.jitter,
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
    scheduler: options.scheduler,
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
    scheduler: options.scheduler,
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
        const timer = options.scheduler.setTimeout(() => {
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
    getSnapshot: () => product.getSnapshot(),
    getCachedSnapshot: () => product.getCachedSnapshot(),
    getRevision: () => product.getRevision(),
    subscribe: product.subscribe,
    window: Object.freeze({
      show: () => product.showWindow(),
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
    })
  };
}
