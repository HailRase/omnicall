# @softomnitel/omnicall-kit

## 0.2.1

### Patch Changes

- Integrator README / guides aligned with production Origin admission: WebSocket
  upgrade is fail-closed (`allowed` Trusted sites / seed only); TOFU-on-upgrade
  superseded (ADR-0018 amended 2026-08-03). Documents `origin_blocked` for unknown
  Origins, Desktop ≥ `1.3.1`, and keeps latest-known `getRevision()` / discovery /
  `waitUntil` DX from `0.2.0`. No wire or public method removals.

## 0.2.0

### Minor Changes

- **ADR-0027 / F-011 production-readiness:** latest-known `getRevision()` from
  snapshots, successful replies, public events, and `stale_state.currentRevision`
  (monotonic; cleared on disconnect/reconnect/revoke/incompatible/failed).
  `getCachedSnapshot()` stays an honest snapshot cache (not patched by replies/events).
- Package-owned `SDK_VERSION` (`0.2.0`); remove manual `sdkVersion` from client options.
- Add `discoverOmniCallDesktop({ fetch, signal? })` for trusted loopback discovery.
- `waitUntil` accepts `{ timeoutMs, signal }` and throws typed `WaitUntilTimeoutError`
  (numeric timeout overload kept).
- Additional protocol DTO re-exports for integrator typing DX.
- Example `crm-pairing-lite` pins workspace kit `0.2.0`; sdk-09 capability regression retained.

## 0.1.4

### Patch Changes

- Clarified that successful mutation replies do not update the SDK snapshot cache:
  hosts must carry `result.revision` for an intentional mutation chain or obtain a
  fresh snapshot before the next mutation. API unchanged.

## 0.1.3

### Patch Changes

- npm README now documents successful reply formats for every public command,
  revision handling, and the complete `operator.changeStatus` /
  `operator.finishAppeal` reservation flow. API unchanged.

## 0.1.2

### Patch Changes

- README для интеграторов: убраны ссылки на приватный GitHub и внутренние
  файлы репозитория (docs/api/examples). Документация самодостаточна в npm
  README. Из `package.json` убраны `repository` / `homepage` / `bugs` на
  закрытый репозиторий. API без изменений.

## 0.1.1

### Patch Changes

- Обновлён npm README: эталонная русская документация для CRM-интегратора
  (установка, быстрый старт, понятия, API Reference, FAQ). API без изменений.

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
