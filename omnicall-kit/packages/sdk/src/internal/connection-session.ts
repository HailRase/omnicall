/**
 * Internal connection session: transport lifecycle, state machine, correlation,
 * heartbeat, and bounded reconnect. No product OmniCallClient methods.
 */

import type { CommandType } from '@softomnitel/omnicall-protocol';

import { isMutationCommand } from './command-classification.js';
import {
  assertTransition,
  type ConnectionState,
  isReconnectEligible,
  isTerminalConnectionState
} from './connection-state.js';
import type { DiagnosticsSink } from './diagnostics.js';
import {
  createHeartbeatController,
  DEFAULT_HEARTBEAT_POLICY,
  type HeartbeatPolicy
} from './heartbeat-controller.js';
import {
  computeReconnectDelayMs,
  DEFAULT_RECONNECT_POLICY,
  hasReconnectAttemptsRemaining,
  type ReconnectPolicy
} from './reconnect-policy.js';
import {
  createRequestCorrelator,
  type PendingRequestResult
} from './request-correlator.js';
import type { JitterSource, Scheduler, TimerHandle } from './scheduler.js';
import type { OmniCallClientError } from './client-errors.js';
import {
  mapTransportCloseToOriginPolicyError
} from './origin-policy-errors.js';
import type { TransportFactory, TransportPort } from './transport-port.js';

export type SessionWireIdentity = {
  readonly serverInstanceId: string;
  readonly sessionEpoch: string;
};

export type ConnectionSessionOptions = {
  readonly url: string;
  readonly transportFactory: TransportFactory;
  readonly scheduler: Scheduler;
  readonly jitter: JitterSource;
  readonly diagnostics?: DiagnosticsSink;
  readonly reconnect?: ReconnectPolicy;
  readonly heartbeat?: HeartbeatPolicy;
  readonly defaultRequestTimeoutMs?: number;
  readonly onUnhandledMessage?: (data: string) => void;
  readonly onHandshaking?: () => void;
};

export type OutboundCommandRequest = {
  readonly requestId: string;
  readonly commandType: CommandType;
  readonly body: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
};

export type ConnectionSession = {
  readonly getState: () => ConnectionState;
  readonly connect: () => void;
  readonly disconnect: () => void;
  readonly requestReauth: () => void;
  readonly setWireIdentity: (identity: SessionWireIdentity | undefined) => void;
  readonly getWireIdentity: () => SessionWireIdentity | undefined;
  readonly signalPairingRequired: () => void;
  readonly signalAuthenticating: () => void;
  readonly signalReady: (heartbeatSeconds?: number) => void;
  readonly signalIncompatible: () => void;
  readonly signalRevoked: () => void;
  readonly signalFailed: () => void;
  readonly signalOriginPolicyFailure: (error: OmniCallClientError) => void;
  readonly getConnectError: () => OmniCallClientError | undefined;
  readonly request: (command: OutboundCommandRequest) => Promise<PendingRequestResult>;
  readonly sendRaw: (body: string) => boolean;
  readonly onStateChange: (listener: (state: ConnectionState) => void) => () => void;
  readonly pendingRequestCount: () => number;
  readonly reconnectAttemptCount: () => number;
  readonly mutationSendCount: () => number;
  readonly activeTransport: () => TransportPort | undefined;
};

export function createConnectionSession(
  options: ConnectionSessionOptions
): ConnectionSession {
  const reconnectPolicy = options.reconnect ?? DEFAULT_RECONNECT_POLICY;
  const heartbeatPolicy = options.heartbeat ?? DEFAULT_HEARTBEAT_POLICY;
  const defaultTimeoutMs = options.defaultRequestTimeoutMs ?? 5_000;
  const diagnostics: DiagnosticsSink | undefined = options.diagnostics;

  let state: ConnectionState = 'idle';
  let transport: TransportPort | undefined;
  let unsubscribers: Array<() => void> = [];
  let reconnectAttempts = 0;
  let reconnectTimer: TimerHandle | undefined;
  let intentionalClose = false;
  let wireIdentity: SessionWireIdentity | undefined;
  let connectError: OmniCallClientError | undefined;

  const stateListeners = new Set<(next: ConnectionState) => void>();
  const correlator = createRequestCorrelator({
    scheduler: options.scheduler,
    ...(diagnostics !== undefined ? { diagnostics } : {})
  });

  const setState = (next: ConnectionState): void => {
    assertTransition(state, next);
    state = next;
    diagnostics?.emit({
      level: 'info',
      code: 'connection.state',
      connectionState: next
    });
    for (const listener of stateListeners) {
      listener(next);
    }
  };

  const clearReconnectTimer = (): void => {
    reconnectTimer?.clear();
    reconnectTimer = undefined;
  };

  const detachTransport = (): void => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
    unsubscribers = [];
    transport = undefined;
  };

  const rejectPending = (reason: 'aborted' | 'disconnect'): void => {
    correlator.rejectAll(reason, state);
  };

  const heartbeat = createHeartbeatController({
    scheduler: options.scheduler,
    ...(diagnostics !== undefined ? { diagnostics } : {}),
    timeoutMs: heartbeatPolicy.timeoutMs,
    connectionState: () => state,
    sendPing: async (timeoutMs) => sendHeartbeatPing(timeoutMs),
    onMissed: () => {
      if (state !== 'ready' || transport === undefined) {
        return;
      }
      intentionalClose = false;
      transport.close(4000, 'heartbeat_missed');
    }
  });

  const sendHeartbeatPing = async (timeoutMs: number): Promise<boolean> => {
    if (state !== 'ready' || transport === undefined) {
      return false;
    }
    const requestId = `hb_${options.scheduler.now()}`;
    const body = JSON.stringify({
      protocolVersion: 1,
      kind: 'command',
      type: 'sdk:ping',
      requestId,
      serverInstanceId: wireIdentity?.serverInstanceId ?? 'pending',
      sessionEpoch: wireIdentity?.sessionEpoch ?? 'pending',
      occurredAt: new Date(options.scheduler.now()).toISOString(),
      payload: {}
    });
    try {
      transport.send(body);
    } catch {
      return false;
    }
    const result = await correlator.track(
      {
        requestId,
        commandType: 'sdk:ping',
        mutation: false
      },
      { timeoutMs, connectionState: state }
    );
    return result.ok;
  };

  const openTransport = (): void => {
    detachTransport();
    intentionalClose = false;
    const next = options.transportFactory();
    transport = next;
    unsubscribers = [
      next.onOpen(() => {
        if (state === 'connecting') {
          setState('handshaking');
          options.onHandshaking?.();
        }
      }),
      next.onMessage((data) => {
        const handled = correlator.handleInbound(data, state);
        if (!handled) {
          options.onUnhandledMessage?.(data);
        }
      }),
      next.onClose((closeInfo) => {
        detachTransport();
        if (intentionalClose || isTerminalConnectionState(state) || state === 'closed') {
          return;
        }
        const originPolicyError = mapTransportCloseToOriginPolicyError(closeInfo, state);
        if (originPolicyError !== undefined) {
          signalOriginPolicyFailure(originPolicyError);
          return;
        }
        if (isReconnectEligible(state)) {
          beginReconnect('transport_closed');
        }
      }),
      next.onError(() => {
        diagnostics?.emit({
          level: 'warn',
          code: 'transport.error',
          connectionState: state
        });
      })
    ];
    next.connect(options.url);
  };

  const beginReconnect = (code: string): void => {
    heartbeat.stop();
    rejectPending('disconnect');
    clearReconnectTimer();
    wireIdentity = undefined;

    if (state !== 'reconnecting' && isReconnectEligible(state)) {
      setState('reconnecting');
    }

    diagnostics?.emit({
      level: 'warn',
      code: `reconnect.${code}`,
      connectionState: state,
      attempt: reconnectAttempts
    });

    if (!hasReconnectAttemptsRemaining(reconnectPolicy, reconnectAttempts)) {
      if (state === 'reconnecting') {
        setState('failed');
      }
      return;
    }

    const delayMs = computeReconnectDelayMs(
      reconnectPolicy,
      reconnectAttempts,
      options.jitter
    );
    reconnectAttempts += 1;
    reconnectTimer = options.scheduler.setTimeout(() => {
      reconnectTimer = undefined;
      if (state !== 'reconnecting') {
        return;
      }
      setState('connecting');
      openTransport();
    }, delayMs);
  };

  const enterTerminal = (next: 'incompatible' | 'revoked' | 'failed'): void => {
    intentionalClose = true;
    clearReconnectTimer();
    heartbeat.stop();
    rejectPending('aborted');
    wireIdentity = undefined;
    if (transport !== undefined) {
      transport.close(1000, next);
    }
    detachTransport();
    setState(next);
  };

  const signalOriginPolicyFailure = (error: OmniCallClientError): void => {
    connectError = error;
    intentionalClose = true;
    clearReconnectTimer();
    heartbeat.stop();
    rejectPending('aborted');
    wireIdentity = undefined;
    if (transport !== undefined) {
      transport.close(1000, 'origin_policy');
    }
    detachTransport();
    if (state !== 'failed') {
      setState('failed');
    }
  };

  const canSendCommand = (commandType: CommandType): boolean => {
    if (state === 'ready') {
      return true;
    }
    return state === 'authenticating' && commandType === 'sdk:ping';
  };

  return {
    getState: () => state,
    connect: () => {
      if (state !== 'idle') {
        throw new Error(`connect() requires idle, got ${state}`);
      }
      reconnectAttempts = 0;
      correlator.clearMutationLedger();
      wireIdentity = undefined;
      connectError = undefined;
      setState('connecting');
      openTransport();
    },
    disconnect: () => {
      if (state === 'closed') {
        return;
      }
      intentionalClose = true;
      clearReconnectTimer();
      heartbeat.stop();
      rejectPending('aborted');
      wireIdentity = undefined;
      connectError = undefined;
      if (transport !== undefined) {
        transport.close(1000, 'client_disconnect');
      }
      detachTransport();
      setState('closed');
    },
    requestReauth: () => {
      if (transport === undefined || !isReconnectEligible(state)) {
        return;
      }
      intentionalClose = false;
      heartbeat.stop();
      rejectPending('disconnect');
      wireIdentity = undefined;
      transport.close(4001, 'reauth_required');
    },
    setWireIdentity: (identity) => {
      wireIdentity = identity;
    },
    getWireIdentity: () => wireIdentity,
    signalPairingRequired: () => {
      setState('pairing_required');
    },
    signalAuthenticating: () => {
      setState('authenticating');
    },
    signalReady: (heartbeatSeconds) => {
      setState('ready');
      reconnectAttempts = 0;
      if (!heartbeatPolicy.enabled) {
        return;
      }
      const intervalMs =
        heartbeatSeconds !== undefined
          ? heartbeatSeconds * 1000
          : heartbeatPolicy.intervalMs;
      heartbeat.start(intervalMs);
    },
    signalIncompatible: () => {
      enterTerminal('incompatible');
    },
    signalRevoked: () => {
      enterTerminal('revoked');
    },
    signalFailed: () => {
      enterTerminal('failed');
    },
    signalOriginPolicyFailure,
    getConnectError: () => connectError,
    sendRaw: (body) => {
      if (transport === undefined) {
        return false;
      }
      const allowUnauth =
        state === 'handshaking' ||
        state === 'pairing_required' ||
        state === 'authenticating';
      if (!allowUnauth && state !== 'ready') {
        return false;
      }
      try {
        transport.send(body);
        return true;
      } catch {
        return false;
      }
    },
    request: async (command) => {
      if (!canSendCommand(command.commandType) || transport === undefined) {
        return {
          ok: false,
          errorCode: 'not_ready',
          reason: 'invalid_reply'
        };
      }
      const mutation = isMutationCommand(command.commandType);
      try {
        transport.send(command.body);
      } catch {
        return {
          ok: false,
          errorCode: 'operation_failed',
          reason: 'disconnect'
        };
      }
      return correlator.track(
        {
          requestId: command.requestId,
          commandType: command.commandType,
          mutation
        },
        {
          timeoutMs: command.timeoutMs ?? defaultTimeoutMs,
          connectionState: state,
          ...(command.signal !== undefined ? { signal: command.signal } : {})
        }
      );
    },
    onStateChange: (listener) => {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
    pendingRequestCount: () => correlator.pendingCount(),
    reconnectAttemptCount: () => reconnectAttempts,
    mutationSendCount: () => correlator.mutationSendCount(),
    activeTransport: () => transport
  };
}
