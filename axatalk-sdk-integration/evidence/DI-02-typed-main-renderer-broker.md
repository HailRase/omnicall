# DI-02 — Typed main-to-renderer broker

**Date:** 2026-07-20 13:30 (local)  
**Branch:** `feature/axatalk-sdk`  
**Desktop version:** `0.11.2`  
**Work unit:** DI-02 — Typed Main-to-Renderer Broker  
**Status:** `done` — `/sdk-review` **PASS** (2026-07-20)

## Prerequisites verified

| Prerequisite | Status |
| --- | --- |
| DI-00 `done` (`/sdk-review` PASS) | yes |
| DI-01 `done` (`/sdk-review` PASS) | yes |
| SDK-01 + SDK-02 `@axatalk/protocol` + fixtures `done` | yes |
| DI-02 was `pending` before this session | yes |
| F-011 `in progress`, not `implemented` | yes (unchanged) |

## Intake (recorded before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration
- Layers: shared IPC, main, preload, integration adapters, Application probe, renderer bootstrap bind
- Non-goals: WS server, pairing, product routers, snapshot mappers, second composition, F-011 implemented, version bump

## Delivered

### Typed IPC surface

- Channels: `sdk-broker:request`, `sdk-broker:reply`, `sdk-broker:set-ready`
- Envelopes + fail-closed parsers: `src/shared/ipc/SdkBrokerContract.ts`
- Preload allowlist on `window.softphone`: `onSdkBrokerRequest`, `replySdkBrokerRequest`, `setSdkBrokerReady`
- Main registration: `src/main/sdk/registerSdkBrokerIpc.ts` (no Domain/Facade imports)

### Port implementation

- `MainToRendererBroker` implements `MainToRendererBrokerPort`
- Reuses `BrokerProductRequest` / `BrokerRequestResult` / `@axatalk/protocol` validators
- Mock broker retained for unit tests

### Lifecycle (ADR-0009)

| Case | Stable code |
| --- | --- |
| Not ready / renderer unavailable / reload pending reject | `not_ready` |
| Timeout | `timeout` |
| Cancel / beginAppShutdown / confirmed shutdown | `operation_failed` |

- Reload clears ready, rejects pending, **no mutation replay** (fresh request after re-ready)
- Quit start: `beginAppShutdown()` cancels pending before renderer telephony cleanup
- Confirmed quit: `shutdown()` stops acceptance
- One Application probe instance (`SdkBrokerProbeHandler`) for `sdk:ping` delivery proof

### Explicit non-goals (confirmed absent)

- No loopback HTTP/WS server, Origin upgrade, pairing, PoP, IndexedDB
- No product snapshot assembler / call-operator-account routers beyond ping probe
- No `window:hide` product enablement; no second composition; no `window.Softphone`
- F-011 **not** marked `implemented`; version **not** bumped

## Verification

| Command | Result |
| --- | --- |
| Focused DI-02 vitest (6 files / 31 tests incl. mock + boundary) | **PASS** (post-review follow-ups) |
| DI-02-only tests (contract 5 + probe 3 + session 3 + broker 12 = 23) | **PASS** |
| `npm test` | **PASS** — **2344 passed / 1 skipped** (+2 vs gate PASS 2342 after cancel-quit tests) |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run registry:check` | **PASS** — **64 found, 0 missing** |

### Focused command

```bash
npx vitest run \
  src/shared/ipc/SdkBrokerContract.test.ts \
  src/adapters/integration/MainToRendererBroker.test.ts \
  src/adapters/integration/RendererSdkBrokerSession.test.ts \
  src/application/integration/SdkBrokerProbeHandler.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/adapters/mock/MockMainToRendererBroker.test.ts
```

## Security / privacy

- `contextIsolation` / `sandbox` / `nodeIntegration: false` / `webSecurity` unchanged
- No raw `ipcRenderer` outside preload
- Broker logs: allowlisted fields only (`commandType`, counts, reasons) — tests assert no nonce/password/apiKey in log JSON
- Domain remains free of protocol/Electron (boundary test green)

## Registry / STATUS

- F-011 stays `in progress`
- DI-02 → `done` (`/sdk-review` PASS 2026-07-20)
- STATUS / P12 handoff / 00-SNAPSHOT updated factually
- Version **not** bumped

## Reviewer notes (`/sdk-review` 2026-07-20)

- **PASS** — no Blockers.
- **High follow-up (closed same day):** `beginAppShutdown()` now pauses via `pausedForShutdown` while preserving `compositionReady`; `cancelSdkBrokerAppShutdown()` wired on `app:cancel-shutdown` restores acceptance without reload. Extra unit tests cover cancel restore + mid-shutdown `setReady`.
- **Low follow-up (closed same day):** broker send prefers the webContents that last claimed ready; reload hooks install per webContents id (not process-global once).

## Remaining risks

- DI-03 must own WS transport without importing Facades
- Product command routers (DI-05+) must not bypass Call Engine
- Packaged Electron E2E deferred to DI-10
- Manual SIP/OCP/call smoke still deferred
- Electron `did-start-loading` hook still not harness-tested (unit coverage on `notifyRendererReload`)

## Handoff

Gate closed. Post-review follow-ups closed. Next unit: **DI-03** loopback WebSocket via `/sdk-integration` (separate session). Do **not** mark F-011 `implemented`.
