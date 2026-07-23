# API Reference

Aligns with [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
If this page disagrees with the API report, the **report wins**.

**Full public inventory:** **55** symbols (see table below). Method/namespace sections are
integrator-oriented summaries; the inventory is the complete export list.

## Public symbol inventory (55)

| Kind | Symbol |
| --- | --- |
| type | `ActivateProfileResult` |
| type | `AuthClient` |
| type | `AuthClientOptions` |
| type | `AuthSessionSnapshot` |
| type | `AxatalkAccountApi` |
| type | `AxatalkCallsApi` |
| type | `AxatalkClient` |
| class | `AxatalkClientError` |
| type | `AxatalkClientOptions` |
| type | `AxatalkEvent` |
| type | `AxatalkOperatorApi` |
| type | `AxatalkWindowApi` |
| type | `BrowserWebSocketConstructor` |
| type | `BrowserWebSocketLike` |
| type | `CallMutationResult` |
| const | `CONNECTION_STATES` |
| type | `ConnectionState` |
| function | `createAuthClient` |
| function | `createAxatalkClient` |
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
| type | `FakeScheduler` |
| type | `HeartbeatPolicy` |
| function | `isAxatalkClientError` |
| function | `isOriginBlockedError` |
| type | `JitterSource` |
| type | `LogoutResult` |
| type | `OperatorFinishAppealResult` |
| type | `OperatorReason` |
| type | `OperatorReasonsResult` |
| type | `OperatorStatusChangeKind` |
| type | `OperatorStatusChangeResult` |
| type | `PairingRequiredInfo` |
| type | `PopKeyStore` |
| const | `PUBLIC_EVENT_TYPES` |
| type | `PublicEventType` |
| type | `ReconnectPolicy` |
| type | `Scheduler` |
| type | `StoredPopIdentity` |
| type | `TimerHandle` |
| type | `TransportCloseInfo` |
| type | `TransportErrorInfo` |
| type | `TransportFactory` |
| type | `TransportPort` |

## Factories

| Symbol | Notes |
| --- | --- |
| `createAxatalkClient(options)` | Preferred public client |
| `createAuthClient(options)` | Auth/lifecycle only (no product namespaces) |
| `createBrowserWebSocketTransport` | Official browser `TransportPort` (default `transportFactory`) |
| `createBrowserScheduler` / `createBrowserJitterSource` | Production timer/jitter defaults |
| `createMemoryPopKeyStore` / `createIndexedDbPopKeyStore` | PoP persistence |
| `createFakeScheduler` / `createFixedJitterSource` | Deterministic tests |
| `createRecordingDiagnosticsSink` | Redaction-safe diagnostics |

`AuthClientOptions` / `AxatalkClientOptions`: `transportFactory`, `scheduler`, and `jitter`
are **optional** in browsers (defaults above). Inject fakes in unit tests. See
[Transport](./transport.md).

## `AxatalkClient` lifecycle

| Method | Returns |
| --- | --- |
| `getState()` | `ConnectionState` |
| `getGrantedCapabilities()` | `readonly CapabilityId[]` |
| `getSession()` | `AuthSessionSnapshot \| undefined` |
| `connect()` | `Promise<void>` |
| `disconnect()` | `void` — **no** hangup / logout / activate |
| `onStateChange(listener)` | unsubscribe `() => void` |
| `onPairingRequired(listener)` | unsubscribe |
| `waitUntil(predicate, timeoutMs?)` | `Promise<ConnectionState>` |
| `getSnapshot()` | `Promise<SnapshotMessage>` |
| `getCachedSnapshot()` | cached snapshot or `undefined` |
| `getRevision()` | `number \| undefined` |
| `subscribe(type, listener)` | unsubscribe |
| `preauthDropCount()` | diagnostics counter |

## `client.calls`

All mutations require `expectedRevision` from a fresh snapshot.

| Method | Capability |
| --- | --- |
| `originate({ destination, expectedRevision })` | `call.originate` |
| `answer` / `reject` / `hangup` | `call.control` |
| `hold` / `resume` | `call.control` |
| `mute` / `unmute` | `call.control` |
| `sendDtmf({ callId, digits, expectedRevision })` | `call.control` |

Result: `{ callId, revision }`. Failures: see [Errors](./errors.md).

## `client.account`

| Method | Capability | Notes |
| --- | --- | --- |
| `logout({ reasonId?, expectedRevision })` | `session.logout` | Single-shot; may throw `interaction_required` + `requiresReason` / `reasons` (no `logoutToken`) |
| `activateProfile({ login, expectedRevision, mode? })` | **`account.activate` (server-granted)** | Saved-account login; optional `sip_only` / `ocp`; never secrets |

## `client.operator`

| Method | Capability |
| --- | --- |
| `getReasons()` | read path (session) |
| `changeStatus({ target, reasonId?, expectedRevision })` | `operator.status.write` — desktop returns `kind: "applied" \| "reserved"` |
| `finishAppeal({ expectedRevision })` | `operator.status.write` — only while public status is `post_call_processing`; OCP login required |

Result type: `OperatorStatusChangeResult` (`kind` is only `"applied" | "reserved"`).  
Full host recipe: [Operator status & reservation](./operator-status-reservation.md).

## `client.window`

| Method | Notes |
| --- | --- |
| `show()` | Capability `window.show` |
| `getState()` | Visibility projection |

`hide` is **not** on the public client (ADR-0013).
