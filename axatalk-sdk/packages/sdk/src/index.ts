/**
 * `@axata/axatalk-sdk` — browser client for Axatalk Desktop local protocol.
 *
 * SDK-08: AxatalkClient with privileged namespaced account.activateProfile.
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
  isOriginBlockedError,
  PUBLIC_EVENT_TYPES,
  type AxatalkAccountApi,
  type AxatalkCallsApi,
  type AxatalkClient,
  type AxatalkClientOptions,
  type AxatalkEvent,
  type AxatalkOperatorApi,
  type AxatalkWindowApi,
  type ActivateProfileResult,
  type CallMutationResult,
  type LogoutResult,
  type OperatorReason,
  type OperatorReasonsResult,
  type OperatorFinishAppealResult,
  type OperatorStatusChangeResult,
  type PublicEventType
} from './public/axatalk-client.js';

export {
  SDK_ACTIVATE_CLIENT_TIMEOUT_MS,
  SDK_ACTIVATE_CONSENT_TTL_MS,
  SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS
} from '@axata/axatalk-protocol';

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
