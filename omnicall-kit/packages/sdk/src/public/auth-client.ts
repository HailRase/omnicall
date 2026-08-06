/**
 * Minimal authenticated connection client (SDK-04).
 * No product snapshot/call/operator/account methods.
 */

import type {
  ApplicationIdentity,
  CapabilityId,
  PairingProfile
} from '@softomnitel/omnicall-protocol';

import { createAuthOrchestrator } from '../internal/auth-orchestrator.js';
import { createConnectionSession } from '../internal/connection-session.js';
import type { ConnectionState } from '../internal/connection-state.js';
import {
  WaitUntilTimeoutError,
  type OmniCallClientError
} from '../internal/client-errors.js';
import type { DiagnosticsSink } from '../internal/diagnostics.js';
import type { PopKeyStore } from '../internal/pop-key-store.js';
import type { ReconnectPolicy } from '../internal/reconnect-policy.js';
import type { HeartbeatPolicy } from '../internal/heartbeat-controller.js';
import type { JitterSource, Scheduler } from '../internal/scheduler.js';
import { createBrowserWebSocketTransport } from '../internal/browser-websocket-transport.js';
import {
  createBrowserJitterSource,
  createBrowserScheduler
} from '../internal/scheduler.js';
import type { TransportFactory } from '../internal/transport-port.js';
import { SDK_VERSION } from './sdk-version.js';

/**
 * Pairing-required notification for consumers.
 * @public
 */
export type PairingRequiredInfo = {
  readonly origin: string;
  readonly requestedProfile: PairingProfile;
  readonly clientId: string | undefined;
};

/**
 * Read-only authenticated session projection.
 * @public
 */
export type AuthSessionSnapshot = {
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
  readonly clientId: string;
  readonly profile: PairingProfile | undefined;
  readonly grantedCapabilities: readonly CapabilityId[];
};

/**
 * Options for {@link createAuthClient}. Constructor has no network side effects.
 * @public
 */
export type AuthClientOptions = {
  readonly url: string;
  readonly origin: string;
  readonly application: ApplicationIdentity;
  readonly requestedProfile: PairingProfile;
  readonly requestedCapabilities?: readonly CapabilityId[];
  readonly keyStore: PopKeyStore;
  /**
   * Fresh {@link TransportPort} per connect/reconnect.
   * Defaults to {@link createBrowserWebSocketTransport} when omitted.
   */
  readonly transportFactory?: TransportFactory;
  /**
   * Clock/timers. Defaults to {@link createBrowserScheduler} when omitted.
   * Inject {@link createFakeScheduler} in unit tests.
   */
  readonly scheduler?: Scheduler;
  /**
   * Reconnect jitter. Defaults to {@link createBrowserJitterSource} when omitted.
   * Inject {@link createFixedJitterSource} in unit tests.
   */
  readonly jitter?: JitterSource;
  readonly diagnostics?: DiagnosticsSink;
  readonly defaultRequestTimeoutMs?: number;
  readonly reconnect?: ReconnectPolicy;
  readonly heartbeat?: HeartbeatPolicy;
};

/**
 * Auth lifecycle client — pairing, PoP, capability projection.
 * @public
 */
export type AuthClient = {
  readonly getState: () => ConnectionState;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
  readonly getSession: () => AuthSessionSnapshot | undefined;
  readonly preauthDropCount: () => number;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly onStateChange: (listener: (state: ConnectionState) => void) => () => void;
  readonly onPairingRequired: (
    listener: (info: PairingRequiredInfo) => void
  ) => () => void;
  readonly waitUntil: (
    predicate: (state: ConnectionState) => boolean,
    options?: number | Readonly<{ timeoutMs?: number; signal?: AbortSignal }>
  ) => Promise<ConnectionState>;
  readonly getConnectError: () => OmniCallClientError | undefined;
};

/**
 * Create an auth client. Does not connect, pair, or authenticate.
 * @public
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
  const pairingListeners = new Set<(info: PairingRequiredInfo) => void>();
  const orchestratorHolder: {
    current: ReturnType<typeof createAuthOrchestrator> | undefined;
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
      orchestratorHolder.current?.onUnhandledMessage(data);
    }
  });

  const orchestrator = createAuthOrchestrator({
    connection,
    origin: options.origin,
    application: options.application,
    sdkVersion: SDK_VERSION,
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

  connection.onStateChange((state) => {
    if (state === 'reconnecting') {
      // Never assume prior grants across reconnect (ARCHITECTURE / SECURITY).
      orchestrator.clearSession();
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
    },
    onStateChange: (listener) => connection.onStateChange(listener),
    onPairingRequired: (listener) => {
      pairingListeners.add(listener);
      return () => {
        pairingListeners.delete(listener);
      };
    },
    waitUntil: (predicate, options = 5_000) =>
      new Promise((resolve, reject) => {
        const normalized =
          typeof options === 'number' ? { timeoutMs: options } : options;
        const timeoutMs = normalized.timeoutMs ?? 5_000;
        if (normalized.signal?.aborted === true) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        if (predicate(connection.getState())) {
          resolve(connection.getState());
          return;
        }
        const timer = scheduler.setTimeout(() => {
          unsubscribe();
          normalized.signal?.removeEventListener('abort', onAbort);
          reject(new WaitUntilTimeoutError(timeoutMs));
        }, timeoutMs);
        const onAbort = (): void => {
          timer.clear();
          unsubscribe();
          reject(new DOMException('Aborted', 'AbortError'));
        };
        const unsubscribe = connection.onStateChange((next) => {
          if (predicate(next)) {
            timer.clear();
            unsubscribe();
            normalized.signal?.removeEventListener('abort', onAbort);
            resolve(next);
          }
        });
        normalized.signal?.addEventListener('abort', onAbort, { once: true });
      }),
    getConnectError: () => connection.getConnectError()
  };
}
