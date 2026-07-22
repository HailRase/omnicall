# API Reference

Aligns with [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
If this page disagrees with the API report, the **report wins**.

**Full public inventory:** **48** symbols (see table below). Method/namespace sections are
integrator-oriented summaries; the inventory is the complete export list for SDK-09.

## Public symbol inventory (48)

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
| type | `CallMutationResult` |
| type | `ConfirmLogoutResult` |
| const | `CONNECTION_STATES` |
| type | `ConnectionState` |
| function | `createAuthClient` |
| function | `createAxatalkClient` |
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
| type | `OperatorReason` |
| type | `OperatorReasonsResult` |
| type | `OperatorStatusChangeResult` |
| type | `PairingRequiredInfo` |
| type | `PopKeyStore` |
| type | `PrepareLogoutResult` |
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
| `createMemoryPopKeyStore` / `createIndexedDbPopKeyStore` | PoP persistence |
| `createFakeScheduler` / `createFixedJitterSource` | Deterministic tests |
| `createRecordingDiagnosticsSink` | Redaction-safe diagnostics |

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
| `prepareLogout({ expectedRevision })` | `session.logout` | May throw `interaction_required` + `logoutToken` |
| `confirmLogout({ logoutToken, reasonId?, expectedRevision })` | `session.logout` | Host confirms; cancel = abandon token |
| `activateProfile({ login, expectedRevision, mode? })` | **`account.activate` (server-granted)** | Saved-account login; optional `sip_only` / `ocp`; never secrets |

## `client.operator`

| Method | Capability |
| --- | --- |
| `getReasons()` | read path (session) |
| `changeStatus({ target, reasonId?, expectedRevision })` | `operator.status.write` |

## `client.window`

| Method | Capability | Notes |
| --- | --- | --- |
| `show()` | `window.show` | Desktop restores/raises the shell per ADR-0013 local focus policy (rate-limited). |
| `getState()` | read | |
| ~~`hide()`~~ | — | **Not available in v1 product** |

## Errors

`AxatalkClientError` + `isAxatalkClientError(value)`.  
Fields: `code`, `retryable`, `currentRevision?`, `details?`.

## Not in the public API

- Root-level `originate` / `activateProfile` (namespaced only)
- Credential login methods
- `account:list-profiles`
- Domain Event names
- `window.hide`
