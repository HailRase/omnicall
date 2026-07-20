/**
 * `@axatalk/sdk` — browser client for Axatalk Desktop local protocol.
 *
 * SDK-07: AxatalkClient with namespaced operator + account logout workflows.
 *
 * @packageDocumentation
 */

export {
  createAuthClient,
  type AuthClient,
  type AuthClientOptions,
  type AuthSessionSnapshot,
  type PairingRequiredInfo
} from './public/auth-client.js';

export {
  AxatalkClientError,
  createAxatalkClient,
  isAxatalkClientError,
  PUBLIC_EVENT_TYPES,
  type AxatalkAccountApi,
  type AxatalkCallsApi,
  type AxatalkClient,
  type AxatalkClientOptions,
  type AxatalkEvent,
  type AxatalkOperatorApi,
  type AxatalkWindowApi,
  type CallMutationResult,
  type ConfirmLogoutResult,
  type OperatorReason,
  type OperatorReasonsResult,
  type OperatorStatusChangeResult,
  type PrepareLogoutResult,
  type PublicEventType
} from './public/axatalk-client.js';

export {
  CONNECTION_STATES,
  type ConnectionState
} from './internal/connection-state.js';

export {
  createIndexedDbPopKeyStore,
  createMemoryPopKeyStore,
  type PopKeyStore,
  type StoredPopIdentity
} from './internal/pop-key-store.js';

export type {
  TransportCloseInfo,
  TransportErrorInfo,
  TransportFactory,
  TransportPort
} from './internal/transport-port.js';

export type {
  FakeScheduler,
  JitterSource,
  Scheduler,
  TimerHandle
} from './internal/scheduler.js';
export {
  createFakeScheduler,
  createFixedJitterSource
} from './internal/scheduler.js';

export type { ReconnectPolicy } from './internal/reconnect-policy.js';
export type { HeartbeatPolicy } from './internal/heartbeat-controller.js';

export type {
  DiagnosticEvent,
  DiagnosticLevel,
  DiagnosticResult,
  DiagnosticsSink
} from './internal/diagnostics.js';
export { createRecordingDiagnosticsSink } from './internal/diagnostics.js';
