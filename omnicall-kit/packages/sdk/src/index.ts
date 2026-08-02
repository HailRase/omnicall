/**
 * `@softomnitel/omnicall-kit` — browser client for OmniCall Desktop local protocol.
 *
 * SDK-08+: OmniCallClient with namespaced product APIs + official browser WebSocket transport.
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
  discoverOmniCallDesktop,
  type OmniCallDiscoveryOptions
} from './public/discovery.js';

export { SDK_VERSION } from './public/sdk-version.js';

export {
  OmniCallClientError,
  WaitUntilTimeoutError,
  createOmniCallClient,
  isOmniCallClientError,
  isConflictError,
  isInteractionRequiredError,
  isOperationFailedError,
  isOriginBlockedError,
  PUBLIC_EVENT_TYPES,
  readConflictErrorDetails,
  readInteractionRequiredDetails,
  readOperationFailedDetails,
  type ActivateProfileMode,
  type ActivateProfileResult,
  type OmniCallAccountApi,
  type OmniCallCallsApi,
  type OmniCallClient,
  type OmniCallClientOptions,
  type OmniCallEvent,
  type OmniCallEventOf,
  type OmniCallOperatorApi,
  type OmniCallWindowApi,
  type CallMutationResult,
  type CapabilityId,
  type ConflictErrorDetails,
  type InteractionRequiredDetails,
  type LogoutResult,
  type OperationFailedDetails,
  type OperatorFinishAppealResult,
  type OperatorReason,
  type OperatorReasonsResult,
  type OperatorStatusChangeKind,
  type OperatorStatusChangeResult,
  type ProtocolErrorCode,
  type PublicEventType,
  type PublicOperatorStatus,
  type SnapshotCallSummary,
  type SnapshotMessage,
  type SnapshotSections,
  type WireJsonObject
} from './public/omnicall-client.js';

export type {
  ApplicationIdentity,
  DiscoveryDocument,
  PairingProfile,
  ProtocolVersion,
  Revision,
  WireJsonValue
} from '@softomnitel/omnicall-protocol';

export {
  SDK_ACTIVATE_CLIENT_TIMEOUT_MS,
  SDK_ACTIVATE_CONSENT_TTL_MS,
  SDK_ACTIVATE_OCP_AUTH_BUDGET_MS,
  SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS
} from '@softomnitel/omnicall-protocol';

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

export {
  createBrowserWebSocketTransport,
  type BrowserWebSocketConstructor,
  type BrowserWebSocketLike,
  type CreateBrowserWebSocketTransportOptions
} from './internal/browser-websocket-transport.js';

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
  createBrowserJitterSource,
  createBrowserScheduler,
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
