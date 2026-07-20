# DI-03 — Loopback WebSocket transport

**Date:** 2026-07-20 14:08 (local)  
**Branch:** `feature/axatalk-sdk`  
**Desktop version:** `0.11.2` (unchanged)  
**Work unit:** DI-03 — Loopback WebSocket Transport  
**Status:** `done` — `/sdk-review` **PASS** (2026-07-20)

## Prerequisites verified

| Prerequisite | Status |
| --- | --- |
| DI-00 `done` (`/sdk-review` PASS) | yes |
| DI-01 `done` (`/sdk-review` PASS) | yes |
| DI-02 `done` (`/sdk-review` PASS; cancel-quit + preferred webContents closed) | yes |
| SDK-01 + SDK-02 `@axatalk/protocol` + fixtures `done` | yes |
| SDK-03 transport core in SDK package | `done` (desktop does not import SDK client product APIs into Domain) |
| DI-03 was `pending` before this session | yes |
| F-011 `in progress`, not `implemented` | yes (unchanged) |
| Desktop version unchanged | yes — `0.11.2` |

## Intake (recorded before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration
- Layers: main infrastructure/adapter, ports implementation, tests, evidence/docs
- Non-goals: pairing/Origin product auth (DI-04), snapshots/events (DI-05), product routers, settings UX, F-011 implemented, version bump, second Application composition

## Dependency selection (blocking)

| Item | Choice |
| --- | --- |
| Package | `ws@8.18.3` (+ `@types/ws@8.18.1` dev) |
| API surface | ESM `WebSocketServer` named export + `noServer` + `handleUpgrade` |
| Docs checked | Context7 `/websockets/ws/8_18_3` (README + `doc/ws.md`) on **2026-07-20** |
| Deprecation | Preferred `WebSocketServer` (current); avoided relying on legacy `WebSocket.Server` alias as the primary surface. No `@deprecated` markers on `WebSocketServer`, `handleUpgrade`, `maxPayload`, `close`, `ping`/`pong` in consulted docs. |
| Why not alternatives | Node built-in has no stable WS *server*; `websocket` / `uWebSockets.js` add native/build complexity for Electron; undici is HTTP client-focused. |
| Placement | Desktop `dependencies` only (main/adapters). Domain remains free of `ws`. |

## Delivered

### Real gateway adapter (handshake-only)

- `LocalWsServerAdapter` implements `ExternalClientGateway`
- Loopback HTTP discovery: `GET http://127.0.0.1:<port>/axatalk/v1/discovery` (ADR-0015)
- WS upgrade: `/axatalk/v1/ws` via `ws` `WebSocketServer({ noServer: true })`
- Bind host default `127.0.0.1`; occupied port → `bind_failed` (gateway fail-closed)
- Electron `requestSingleInstanceLock` before endpoint ownership; `mayClaimEndpoint` gate
- Handshake: `sdk:client-hello` → `sdk:server-hello` (`pairingRequired: true`)
- Product commands (incl. `sdk:get-snapshot`) → failure reply `unauthenticated`
- Pairing/auth frames → close `forbidden` (DI-04 owns product pairing)
- `MockExternalClientGateway` retained for unit tests

### Limits + lifecycle

| Limit | Default |
| --- | --- |
| Frame size | `DEFAULT_MAX_MESSAGE_BYTES` (65536) via `maxPayload` + validator |
| JSON depth / keys / arrays | `@axatalk/protocol` validators |
| Max connections | 8 |
| Rate limit | 30 msgs / 10s per connection |
| Outbound queue | 16 |
| Handshake timeout | 10s |
| Unauth idle | 60s |
| Heartbeat | WS `ping` every `heartbeatSeconds` (15); miss → disconnect |

Teardown: terminate clients, clear timers, close WSS + HTTP, release port.  
App quit: `beginAppShutdown` stops new upgrades; `stop` on finalize; cancel restores acceptance.

### Main wiring

- `src/main/sdk/registerSdkGateway.ts`
- `src/main/index.ts`: single-instance lock + non-blocking `startSdkGateway`
- Disable via `AXATALK_SDK_GATEWAY=0` (settings UX still DI-09)
- Gateway start failure does not block SIP-only boot

### Explicit non-goals (confirmed absent)

- Origin allowlist / PoP / pairing store (DI-04)
- Snapshot assembler / live Domain Event mappers (DI-05)
- Call/operator/account product routers
- `window.Softphone` / DOM event bus
- Second Facade / Call Engine / SIP / OCP composition in main
- F-011 **not** marked `implemented`; version **not** bumped

## Verification

| Command | Result |
| --- | --- |
| Focused DI-03 vitest (7 files / 35 tests) | **PASS** |
| `npm test` | **PASS** — **2370 passed / 1 skipped** (+6 vs post-review 2364; +26 vs DI-02 2344) |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run registry:check` | **PASS** — **67 found, 0 missing** |

### Focused command

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsSessionRegistry.test.ts \
  src/adapters/integration/sdkGatewayPeer.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/main/sdk/registerSdkGateway.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/adapters/mock/MockExternalClientGateway.test.ts
```

### Test coverage map (TEST-MATRIX)

1. Loopback bind + discovery — yes  
2. Occupied port fail-closed — yes  
3. Second-instance / `mayClaimEndpoint` — yes (+ main single-instance lock)  
4. Malformed frames fail-closed — yes  
5. Oversized + deep JSON (validator + live WS frame) — yes  
6. Connection + rate + outbound queue limits — yes  
7. Handshake timeout + unauth idle + heartbeat miss — yes  
8. Deterministic stop/teardown — yes (gateway stop awaited before quit)  
9. Unauthenticated product deny — yes  
10. Domain/UI boundary — yes  
11. No secret/PII/payload in logs — yes  
12. Domain import-clean — yes  
13. Non-loopback bind host rejected (`invalid_bind_host`) — yes  

## Security / privacy

- `contextIsolation` / `sandbox` / `nodeIntegration: false` / `webSecurity` unchanged
- Loopback peer check on upgrade; bind-host allowlist (`127.0.0.1` / `::1` only); explicit `null` Origin rejected (full allowlist = DI-04)
- Logs: allowlisted fields only (counts, reasons, host/port) — tests assert no nonce/password/apiKey/payload bodies
- Domain free of protocol/Electron/ws (boundary test green)

## Registry / STATUS

- F-011 stays `in progress`
- DI-03 → `done` (`/sdk-review` PASS + High/Low follow-ups closed)
- Version **not** bumped

## Remaining risks / next

- DI-04: exact Origin allowlist, pairing, PoP, capabilities
- DI-05: snapshots/events
- Packaged E2E at DI-10
- Default gateway enablement until DI-09 settings (disable with `AXATALK_SDK_GATEWAY=0`)

## Reviewer

`/sdk-review` **PASS** for **DI-03 only** (2026-07-20). High/Low follow-ups remediated same day. Next unit: DI-04 via `/sdk-integration`.
