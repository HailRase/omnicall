# @softomnitel/omnicall-kit

## 0.1.0

### Minor Changes

- First **stable** public release (Mode B) after DI-10 full close (2026-07-27).
  Same product surface as `0.1.0-rc.0`: OmniCallClient namespaces, pairing/PoP,
  call/operator/account/window APIs. npm dist-tag **`latest`**.
  F-011 `implemented`; P12 closed. Install: `npm i @softomnitel/omnicall-kit`.

### Patch Changes

- Updated dependencies
  - @softomnitel/omnicall-protocol@0.1.0

## 0.1.0-rc.0

### Minor Changes

- First public release candidate (Mode A). Incubation complete through SDK-09/SDK-10 Mode A.
  Published on npm dist-tag **`rc`**.

### Patch Changes

- Updated dependencies
  - @softomnitel/omnicall-protocol@0.1.0-rc.0

### Typing DX (additive, 2026-07-27)

- Re-export integrator DTOs from `@softomnitel/omnicall-kit`: `SnapshotMessage`,
  `SnapshotSections`, `SnapshotCallSummary`, `CapabilityId`, `ProtocolErrorCode`,
  `PublicOperatorStatus`, `WireJsonObject`
- `OmniCallEventOf<'event-name'>` helper; tightened activate/operator result DTOs
- Typed error helpers; guide `docs/guide/typescript.md`

### Included since incubation (SDK-00…SDK-09 + transport defaults)

- `OmniCallClient` lifecycle: connect, pair, ready, disconnect, revoke, incompatible
- Namespaces: `calls`, `account`, `operator`, `window` (`show` / `hide` / `getState`)
- Fail-closed capabilities; privileged caps stripped at pairing (`account.activate`, `window.hide`)
- `client.window.hide({ expectedRevision })` product-available (ADR-0013 amended)
- Bounded reconnect with fresh snapshot; no mutation replay
- Official browser WebSocket adapter: `createBrowserWebSocketTransport`
- Public surface: see `etc/api/sdk.api.md`
