# @axata/axatalk-sdk

## Unreleased — RC staging (SDK-10 Mode A)

First public release candidate target: **`0.1.0-rc.0`** on npm dist-tag **`rc`**.

Packages remain `private: true` / `0.0.0` in the incubating workspace until a human
authorizes registry publish. Stable / `latest` is **blocked on desktop DI-10** (packaged
Electron E2E).

### Typing DX (additive, 2026-07-27)

- Re-export integrator DTOs from `@axata/axatalk-sdk`: `SnapshotMessage`,
  `SnapshotSections`, `SnapshotCallSummary`, `CapabilityId`, `ProtocolErrorCode`,
  `PublicOperatorStatus`, `WireJsonObject`
- `AxatalkEventOf<'event-name'>` helper; tightened
  `ActivateProfileResult.mode` → `ActivateProfileMode`,
  `OperatorStatusChangeResult.accepted` → `true`,
  `targetStatus` → `PublicOperatorStatus`
- Typed error helpers: `isInteractionRequiredError` /
  `readInteractionRequiredDetails`, conflict / operation_failed readers
- Guide: `docs/guide/typescript.md`; inventory sync via `docs:check` (no hardcoded count)

### Included since incubation (SDK-00…SDK-09 + transport defaults)

- `AxatalkClient` lifecycle: connect, pair, ready, disconnect, revoke, incompatible
- Namespaces: `calls`, `account`, `operator`, `window` (`show` / `hide` / `getState`)
- Fail-closed capabilities; privileged caps stripped at pairing (`account.activate`, `window.hide`)
- `client.window.hide({ expectedRevision })` product-available (ADR-0013 amended
  2026-07-27): Origin matrix grant, telephony-busy `conflict`, tray Show recovery
- Bounded reconnect with fresh snapshot; no mutation replay
- Official browser WebSocket adapter: `createBrowserWebSocketTransport`
- Browser defaults for `transportFactory` / `scheduler` / `jitter` (still injectable for tests)
- Guide: `docs/guide/transport.md`
- Public surface: see `etc/api/sdk.api.md` (allowlisted symbols)
- Operator post-call booking observability: optional snapshot/event `reservedTarget` /
  `reservedReasonId`; `OperatorStatusChangeResult.kind` narrowed to `"applied" | "reserved"`;
  guide `docs/guide/operator-status-reservation.md` (no separate reserve command)

### Not included

- Stable npm `latest` publish
- Packaged Electron E2E claims (DI-10)
- Example `crm-pairing-lite` as a published package (workspace-private)
