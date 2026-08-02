# API Reference

Aligns with [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
If this page disagrees with the API report, the **report wins**.

**Full public inventory:** **87** symbols (see table below). Method/namespace sections are
integrator-oriented summaries; the inventory is the complete export list.

Typing DX (imports, `OmniCallEventOf`, error readers): [TypeScript](./typescript.md).

## Public symbol inventory (87)

| Kind | Symbol |
| --- | --- |
| type | `ActivateProfileMode` |
| type | `ActivateProfileResult` |
| re-export | `ApplicationIdentity` |
| type | `AuthClient` |
| type | `AuthClientOptions` |
| type | `AuthSessionSnapshot` |
| type | `OmniCallAccountApi` |
| type | `OmniCallCallsApi` |
| type | `OmniCallClient` |
| class | `OmniCallClientError` |
| type | `OmniCallClientOptions` |
| type | `OmniCallEvent` |
| type | `OmniCallEventOf` |
| type | `OmniCallDiscoveryOptions` |
| type | `OmniCallOperatorApi` |
| type | `OmniCallWindowApi` |
| type | `BrowserWebSocketConstructor` |
| type | `BrowserWebSocketLike` |
| type | `CallMutationResult` |
| re-export | `CapabilityId` |
| type | `ConflictErrorDetails` |
| const | `CONNECTION_STATES` |
| type | `ConnectionState` |
| function | `createAuthClient` |
| function | `createOmniCallClient` |
| function | `discoverOmniCallDesktop` |
| function | `createBrowserJitterSource` |
| function | `createBrowserScheduler` |
| function | `createBrowserWebSocketTransport` |
| type | `CreateBrowserWebSocketTransportOptions` |
| function | `createFakeScheduler` |
| function | `createFixedJitterSource` |
| function | `createIndexedDbPopKeyStore` |
| function | `createMemoryPopKeyStore` |
| function | `createRecordingDiagnosticsSink` |
| type | `DiagnosticEvent` |
| type | `DiagnosticLevel` |
| type | `DiagnosticResult` |
| type | `DiagnosticsSink` |
| type | `DiscoveryDocument` |
| type | `FakeScheduler` |
| type | `HeartbeatPolicy` |
| type | `InteractionRequiredDetails` |
| function | `isOmniCallClientError` |
| function | `isConflictError` |
| function | `isInteractionRequiredError` |
| function | `isOperationFailedError` |
| function | `isOriginBlockedError` |
| type | `JitterSource` |
| type | `LogoutResult` |
| type | `OperationFailedDetails` |
| type | `OperatorFinishAppealResult` |
| type | `OperatorReason` |
| type | `OperatorReasonsResult` |
| type | `OperatorStatusChangeKind` |
| type | `OperatorStatusChangeResult` |
| type | `PairingRequiredInfo` |
| re-export | `PairingProfile` |
| type | `PopKeyStore` |
| re-export | `ProtocolErrorCode` |
| re-export | `ProtocolVersion` |
| const | `PUBLIC_EVENT_TYPES` |
| type | `PublicEventType` |
| re-export | `PublicOperatorStatus` |
| function | `readConflictErrorDetails` |
| function | `readInteractionRequiredDetails` |
| function | `readOperationFailedDetails` |
| type | `ReconnectPolicy` |
| re-export | `Revision` |
| type | `Scheduler` |
| re-export | `SDK_ACTIVATE_CLIENT_TIMEOUT_MS` |
| re-export | `SDK_ACTIVATE_CONSENT_TTL_MS` |
| re-export | `SDK_ACTIVATE_OCP_AUTH_BUDGET_MS` |
| re-export | `SDK_ACTIVATE_SIP_ONLY_AUTH_BUDGET_MS` |
| const | `SDK_VERSION` |
| re-export | `SnapshotCallSummary` |
| re-export | `SnapshotMessage` |
| re-export | `SnapshotSections` |
| type | `StoredPopIdentity` |
| type | `TimerHandle` |
| type | `TransportCloseInfo` |
| type | `TransportErrorInfo` |
| type | `TransportFactory` |
| type | `TransportPort` |
| re-export | `WireJsonObject` |
| re-export | `WireJsonValue` |
| class | `WaitUntilTimeoutError` |

## Factories

| Symbol | Notes |
| --- | --- |
| `createOmniCallClient(options)` | Preferred public client |
| `createAuthClient(options)` | Auth/lifecycle only (no product namespaces) |
| `discoverOmniCallDesktop(options)` | Validates only the fixed loopback discovery endpoint |
| `createBrowserWebSocketTransport` | Official browser `TransportPort` (default `transportFactory`) |
| `createBrowserScheduler` / `createBrowserJitterSource` | Production timer/jitter defaults |
| `createMemoryPopKeyStore` / `createIndexedDbPopKeyStore` | PoP persistence |
| `createFakeScheduler` / `createFixedJitterSource` | Deterministic tests |
| `createRecordingDiagnosticsSink` | Redaction-safe diagnostics |

`AuthClientOptions` / `OmniCallClientOptions`: `transportFactory`, `scheduler`, and `jitter`
are **optional** in browsers (defaults above). Inject fakes in unit tests. See
[Transport](./transport.md).

## `OmniCallClient` lifecycle

| Method | Returns |
| --- | --- |
| `getState()` | `ConnectionState` |
| `getGrantedCapabilities()` | `readonly CapabilityId[]` |
| `getSession()` | `AuthSessionSnapshot \| undefined` |
| `connect()` | `Promise<void>` |
| `disconnect()` | `void` — **no** hangup / logout / activate |
| `onStateChange(listener)` | unsubscribe `() => void` |
| `onPairingRequired(listener)` | unsubscribe |
| `waitUntil(predicate, timeoutMs \| { timeoutMs?, signal? })` | `Promise<ConnectionState>` (`WaitUntilTimeoutError` on timeout) |
| `getSnapshot()` | `Promise<SnapshotMessage>` |
| `getCachedSnapshot()` | cached snapshot or `undefined` |
| `getRevision()` | latest-known concurrency token (`number \| undefined`) |
| `subscribe(type, listener)` | unsubscribe — payload narrowed by `type` (`OmniCallEventOf`) |
| `preauthDropCount()` | diagnostics counter |

## `client.calls`

All mutations require `expectedRevision` from a fresh snapshot.

| Method | Capability |
| --- | --- |
| `originate({ destination, expectedRevision })` | `call.originate` |
| `answer` / `reject` / `hangup` | `call.answer` / `call.reject` / `call.hangup` (or umbrella `call.control`) |
| `hold` / `resume` | `call.hold` (or `call.control`) |
| `mute` / `unmute` | `call.mute` (or `call.control`) |
| `sendDtmf({ callId, digits, expectedRevision })` | `call.control` only |

Result: `{ callId, revision }`. Failures: see [Errors](./errors.md).

## `client.account`

| Method | Capability | Notes |
| --- | --- | --- |
| `logout({ reasonId?, expectedRevision })` | `session.logout` | Single-shot; may throw `interaction_required` — use `readInteractionRequiredDetails` (no `logoutToken`) |
| `activateProfile({ login, expectedRevision, mode? })` | **`account.activate` (server-granted)** | `mode?: ActivateProfileMode` (`sip_only` \| `ocp`); never secrets |

## `client.operator`

| Method | Capability |
| --- | --- |
| `getReasons()` | read path (session) |
| `changeStatus({ target, reasonId?, expectedRevision })` | `operator.status.write` — desktop returns `kind: "applied" \| "reserved"` |
| `finishAppeal({ expectedRevision })` | `operator.status.write` — only while public status is `post_call_processing`; OCP login required |

Result type: `OperatorStatusChangeResult`:
`{ accepted: true, kind: "applied" | "reserved", targetStatus: PublicOperatorStatus, reasonId: number, revision: number }`.
`targetStatus` / `reasonId` are the accepted booking values when `kind` is
`"reserved"`; they do not mean that the current coarse status already changed.
See the full host recipe: [Operator status & reservation](./operator-status-reservation.md).

## `client.window`

| Method | Notes |
| --- | --- |
| `show()` | Capability `window.show` |
| `hide({ expectedRevision })` | Privileged capability `window.hide` — Origin matrix grant only; denied while telephony busy (`conflict`) |
| `getState()` | Visibility projection |

`hide` stays **privileged**: never request it at pairing; enable in OmniCall Settings → SDK Origin matrix. Recovery uses tray Show + `show()` (ADR-0013).
