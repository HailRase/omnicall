# Desktop SDK Integration Work Units

## Progress

- [x] DI-00 — ADRs, baseline, and P12 handoff (`done`)
- [x] DI-01 — Protocol contracts, ports, and mocks (`done`)
- [x] DI-02 — Typed main-to-renderer broker (`done`)
- [x] DI-03 — Loopback WebSocket transport (`done`)
- [x] DI-04 — Pairing, Origin, capabilities, and revocation (`done`)
- [x] DI-05 — Read-only snapshot, events, and window show (`done`)
- [x] DI-06 — Call command router (`done`)
- [x] DI-07 — Operator status and logout workflow (`done`)
- [x] DI-08 — Saved-profile activation (`done`)
- [x] DI-09 — Settings and operational UX (`done`)
- [ ] DI-10 — Compatibility, E2E, and P12 close (`review` — Blocker/High/Low remediated 2026-07-21; re-request `/sdk-review`; F-011/P12 not closed)

Allowed statuses: `pending`, `in progress`, `review`, `done`, `blocked`.

## Execution Template

Each agent must include this checklist in its handoff:

- Work unit:
- Prerequisites verified:
- Feature/LF IDs:
- Bounded contexts:
- Layers changed:
- Files added/changed:
- Commands/events added:
- Security impact:
- Regression risks:
- Automated tests:
- Manual evidence:
- Verification commands:
- Registry/Legacy/STATUS changes:
- Remaining risks:
- Reviewer:

---

## DI-00 — ADRs, Baseline, and P12 Handoff

Prerequisites: none.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Prepare the architecture gate for F-011/P12. Create the required ADRs and a detailed
> handoff from `IMPLEMENTATION-PLAN.md`, synchronize decisions with SDK-01, capture current
> preflight and manual regression baseline, and update F-011 planning references. Write no
> production code and install no dependencies.

Checklist:

- [x] process ownership and broker lifecycle ADR.
- [x] transport/browser discovery ADR.
- [x] pairing/capability/replay ADR.
- [x] protocol/version/privacy/ownership ADR.
- [x] window policy and SDK sign-in relationship ADR.
- [x] P12 handoff with DI-01…DI-10 gates.
- [x] automated and manual baseline recorded.
- [x] architecture review passes. *(`/sdk-review` PASS 2026-07-20; High/Low findings remediated)*

### Handoff checklist (DI-00)

- Work unit: DI-00
- Prerequisites verified: none required
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration (primary)
- Layers changed: documentation / ADR only (no `src/`)
- Files added/changed:
  - `docs/softphone/adr/ADR-0009-sdk-process-ownership-broker-lifecycle.md`
  - `docs/softphone/adr/ADR-0010-sdk-local-transport-endpoint-discovery.md`
  - `docs/softphone/adr/ADR-0011-sdk-pairing-origin-capabilities.md`
  - `docs/softphone/adr/ADR-0012-sdk-protocol-versioning-privacy-ownership.md`
  - `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
  - `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
  - `axatalk-sdk-integration/evidence/DI-00-baseline.md`
  - `axatalk-sdk-integration/00-SNAPSHOT.md`
  - `axatalk-sdk/docs/PROTOCOL.md` (open decisions table)
  - Feature Registry F-011 planning refs; `STATUS.md`
- Commands/events added: none (design only)
- Security impact: policy ADRs accepted; implementation deferred to DI-03/04; open PoP/schema/PII rows owned by SDK-01
- Regression risks: none from code (docs-only); catalog check pre-existing fail recorded
- Automated tests: `npm run release:preflight` PASS — 2297 passed / 1 skipped
- Manual evidence: smoke checklist frozen; not executed this session
- Verification commands: `npm run release:preflight`, `npm run i18n:check`, `npm run ui:catalog:check`
- Registry/Legacy/STATUS changes: planning refs only; F-011 remains `planned`
- Remaining risks / open: O-SCHEMA-1, O-DISC-*, O-BRW-*, O-POP-*, O-CAP-1, O-PII-1, O-OWN-1, O-CAMP-1, O-OCP-1 (see P12 handoff)
- Evidence: `axatalk-sdk-integration/evidence/DI-00-baseline.md`
- Reviewer: `/sdk-review` PASS (2026-07-20); High/Low findings remediated in follow-up

## DI-01 — Protocol Contracts, Ports, and Mocks

Prerequisites: DI-00 and SDK-01 done; SDK-02 `@axatalk/protocol` done (peer consume).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

### Intake (before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration (primary). No Telephony Domain rules in this unit.
- Layers allowed: Ports + Application-boundary adapters/tests; consume `@axatalk/protocol`
  outside Domain only.
- Layers forbidden for business logic: Domain, React UI, Zustand stores, Call Engine,
  JsSIP adapters, OCP wire adapters (except interface stubs).
- Regression risks (refuse to break):
  1. SIP-only sign-in / register / recover / logout with OCP disabled
  2. Optional OCP remains optional (no forced OCP)
  3. Active call controls / media / headset paths untouched
  4. No second Application composition / Facade in main
  5. No Domain import of Zod / `@axatalk/protocol` / Electron / IPC
  6. Preload/sandbox not weakened
  7. No `window.Softphone` / DOM event bus resurrection
  8. Transfer backlog not touched
  9. No secret/PII leakage into new logs or DTOs

Agent prompt:

> Add the protocol boundary, focused ports, parsers, and test doubles. Keep Domain and UI
> independent from protocol and Electron. Do not add IPC or a network server.

Checklist:

- [x] protocol package/fixture integration.
- [x] external gateway and broker ports.
- [x] command/query handler interfaces.
- [x] mock gateway and broker.
- [x] valid/invalid fixture tests.
- [x] dependency-boundary tests.
- [x] F-011 remains `in progress`, not implemented.

### Handoff checklist (DI-01)

- Work unit: DI-01
- Prerequisites verified: DI-00 `done`; SDK-01 `done`; SDK-02 `done`
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: Ports + mock adapters + tests; `package.json` file dep on `@axatalk/protocol`; eslint Domain restriction + `axatalk-sdk/**` ignore
- Files added/changed:
  - `src/ports/integration/ExternalClientGateway.ts`
  - `src/ports/integration/MainToRendererBrokerPort.ts`
  - `src/ports/integration/ExternalCommandHandler.ts`
  - `src/adapters/mock/MockExternalClientGateway.ts` (+ test)
  - `src/adapters/mock/MockMainToRendererBroker.ts` (+ test)
  - `src/adapters/mock/MockExternalCommandHandler.ts` (+ test)
  - `src/ports/integration/protocol-fixture-consume.test.ts`
  - `src/ports/integration/sdk-dependency-boundary.test.ts`
  - `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md`
  - Feature Registry / STATUS / P12 handoff (factual)
- Commands/events added: none (interfaces only)
- Security impact: fail-closed protocol validation in mocks; no transport/IPC; Domain import ban
- Regression risks: additive/inert; full suite green (2321 / 1 skipped)
- Automated tests: 24 DI-01 tests; full `npm test` PASS
- Manual evidence: smoke not claimed
- Verification commands: focused vitest; `npm test`; `npm run lint`; `npm run typecheck`
- Registry/Legacy/STATUS changes: F-011 → `in progress`; not `implemented`
- Remaining risks: DI-02 broker ownership; live mapper schema tightness; smoke deferred to DI-10
- Evidence: `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md`
- Reviewer: `/sdk-review` **PASS** (2026-07-20) — Low nits only; **do not start DI-02 in this review session**

## DI-02 — Typed Main-to-Renderer Broker

Prerequisites: DI-01 done.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

### Intake (before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration (primary)
- Layers: shared IPC, main, preload, ports adapters, thin Application probe + renderer bootstrap bind
- Layers forbidden: Domain rules, UI Kit, WS/pairing/product routers, second composition
- Regression risks refused: SIP-only; optional OCP; call/media/headset; single composition; Domain free of protocol; sandbox/preload; no Softphone; transfer backlog; no secret/PII in broker logs

Agent prompt:

> Implement and test the narrow main-to-renderer request/reply broker. Route product commands
> to the single existing renderer Application composition. Do not add network transport or
> product commands.

Checklist:

- [x] typed shared IPC channels/envelopes.
- [x] runtime validation on every boundary.
- [x] minimal preload exposure.
- [x] readiness, timeout, cancellation, reload, and shutdown behavior.
- [x] pending-request cleanup.
- [x] no raw `ipcRenderer`.
- [x] no second Facade/composition.

### Handoff checklist (DI-02)

- Work unit: DI-02
- Prerequisites verified: DI-00 `done`; DI-01 `done` (`/sdk-review` PASS); SDK-01+SDK-02 `done`
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: shared IPC, main registration, preload allowlist, integration adapters, Application probe, renderer bootstrap bind
- Files added/changed:
  - `src/shared/ipc/IpcChannels.ts`, `SdkBrokerContract.ts` (+ test), `PreloadApi.ts`
  - `src/adapters/integration/MainToRendererBroker.ts` (+ test)
  - `src/adapters/integration/RendererSdkBrokerSession.ts` (+ test)
  - `src/application/integration/SdkBrokerProbeHandler.ts` (+ test)
  - `src/main/sdk/registerSdkBrokerIpc.ts`; wire in `src/main/index.ts`
  - `src/preload/index.ts`; `src/renderer/bootstrap/bindSdkBrokerSession.ts`; `useAccountBootstrap.ts`
  - `axatalk-sdk-integration/evidence/DI-02-typed-main-renderer-broker.md`
- Commands/events added: IPC `sdk-broker:request|reply|set-ready`; product probe `sdk:ping` only
- Security impact: fail-closed IPC parsers; allowlisted broker logs (no payloads); sandbox/preload unchanged
- Regression risks: additive broker path; SIP/OCP/call paths untouched; F-011 not implemented
- Automated tests: 23 DI-02 broker/session/contract/probe tests (+ mock/boundary); full suite **2344 passed / 1 skipped** after follow-ups
- Manual evidence: smoke not claimed
- Verification commands: focused vitest; `npm test`; `npm run lint`; `npm run typecheck`; `npm run registry:check`
- Registry/Legacy/STATUS changes: F-011 stays `in progress`; DI-02 → `done`
- Remaining risks: DI-03 WS transport; product routers deferred; packaged E2E at DI-10
- Evidence: `axatalk-sdk-integration/evidence/DI-02-typed-main-renderer-broker.md`
- Reviewer: `/sdk-review` **PASS** (2026-07-20) — no Blockers; High/Low follow-ups closed same day (cancel-quit restore + preferred webContents reload hooks)

## DI-03 — Loopback WebSocket Transport

Prerequisites: DI-02 done.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

### Intake (before coding)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration
- Layers: main infrastructure/adapter, ports implementation, shared validation as needed, tests, evidence/docs
- Layers forbidden: Domain rules, renderer product UI, pairing storage, snapshot mappers, call/operator routers
- Regression risks refused: SIP-only auth; optional OCP; call/media/headset; single composition; Domain free of protocol/Electron/ws; sandbox/preload; no `window.Softphone`; transfer backlog; no secret/PII in logs

Agent prompt:

> Implement a handshake-only loopback WebSocket adapter in Electron main. Verify official
> dependency documentation and deprecation status first. Add single-instance ownership,
> resource limits, teardown, and abuse tests. Expose no product snapshot or command.

Checklist:

- [x] maintained dependency selected and justified.
- [x] loopback-only binding.
- [x] single-instance lock and occupied-port failure.
- [x] frame/depth/connection/rate/queue limits.
- [x] heartbeat and auth timeout.
- [x] deterministic teardown.
- [x] unauthenticated product access impossible.

### Handoff checklist (DI-03)

- Work unit: DI-03
- Prerequisites verified: DI-00/01/02 `done` (`/sdk-review` PASS); SDK-01+SDK-02 `done`; SDK-03 `done` (SDK package)
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: adapters/integration (LocalWsServerAdapter + helpers), main/sdk registration, package `ws`, tests, evidence/docs
- Files added/changed:
  - `src/adapters/integration/LocalWsServerAdapter.ts` (+ test)
  - `src/adapters/integration/LocalWsSessionRegistry.ts`
  - `src/adapters/integration/sdkGateway*.ts` / `localWsServer*.ts`
  - `src/main/sdk/registerSdkGateway.ts` (+ test); wire in `src/main/index.ts`
  - `package.json` — `ws@8.18.3`, `@types/ws`
  - `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md`
- Commands/events added: none product; handshake + discovery HTTP only; product cmds denied `unauthenticated`
- Security impact: loopback bind, single-instance, limits, fail-closed unauth product path; Origin allowlist deferred DI-04
- Regression risks: additive gateway; SIP/OCP/call untouched; F-011 not implemented
- Automated tests: 35 focused DI-03 (+ mock/boundary/registry); full suite **2370 passed / 1 skipped** (High/Low follow-ups closed)
- Manual evidence: smoke not claimed
- Verification commands: focused vitest; `npm test`; `npm run lint`; `npm run typecheck`; `npm run registry:check`
- Registry/Legacy/STATUS changes: F-011 stays `in progress`; DI-03 → `done`
- Remaining risks: DI-04 pairing/Origin; DI-05 snapshots; packaged E2E at DI-10
- Evidence: `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md`
- Reviewer: `/sdk-review` **PASS** (2026-07-20) — no Blockers; High/Low follow-ups closed same day; next DI-04 via `/sdk-integration`

## DI-04 — Pairing, Origin, Capabilities, and Revocation

Prerequisites: DI-03 done; SDK-01/02/03 done; SDK-04 may remain pending (desktop server-side only).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

### Intake (before coding)

- Feature/LF: F-011; LF-080, LF-081 (primary); LF-051, LF-065
- Bounded context: Integration (primary)
- Layers: adapters/integration, main/sdk, ports/secrets IDs, main secret storage adapter
- Layers forbidden: Domain rules, product snapshot/event mappers (DI-05), call routers (DI-06+), full Settings UX (DI-09), second Application composition
- Regression risks refused: SIP-only boot; optional OCP; DI-03 transport limits; Domain free of protocol; sandbox/preload; no Softphone; transfer backlog; no secret/PII in logs

Agent prompt:

> Implement exact Origin checks, approved per-client pairing, authenticated sessions,
> capability enforcement, replay protection, expiry, and revocation. Do not expose product
> commands beyond the handshake test command.

Checklist:

- [x] exact Origin allowlist.
- [x] local/admin approval.
- [x] secure per-client storage.
- [x] nonce/request replay protection.
- [x] capability check per command/subscription.
- [x] revoke and expiry.
- [x] safe audit logs.
- [x] independent security review passes. *(`/sdk-review` PASS 2026-07-20 — no Blockers; High/Low remediations closed same day)*

### Handoff checklist (DI-04)

- Work unit: DI-04
- Prerequisites verified: DI-00…DI-03 `done`; SDK-01…SDK-03 `done`; SDK-04 not required for desktop server-side
- Feature/LF IDs: F-011; LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: integration adapters, main SDK registration, SecretStorage scope IDs, main SecretStoragePort adapter
- Files added/changed:
  - `src/adapters/integration/sdkGatewayOriginPolicy.ts` (+ test)
  - `src/adapters/integration/sdkGatewayPairingStore.ts` / `sdkGatewayPairingTypes.ts` / `sdkGatewayPairingApprover.ts`
  - `src/adapters/integration/sdkGatewayPopCrypto.ts` (+ test)
  - `src/adapters/integration/sdkGatewayAuthChallenge.ts` / `sdkGatewayCapabilities.ts` / `sdkGatewayRequestDedup.ts`
  - `src/adapters/integration/sdkGatewaySessionAuth.ts` / `sdkGatewaySessionDispatch.ts` / `sdkGatewaySessionSocket.ts`
  - `src/adapters/integration/LocalWsServerAdapter.ts` / `LocalWsSessionRegistry.ts` / `localWsServerUpgrade.ts` / `localWsServerBind.ts`
  - `src/adapters/integration/LocalWsServerAdapter.auth.test.ts`
  - `src/main/sdk/registerSdkGateway.ts` / `src/main/secrets/MainProcessSecretStorageAdapter.ts`
  - `src/ports/secrets/SecretStoragePort.ts` (SDK pairing secret IDs)
  - evidence `axatalk-sdk-integration/evidence/DI-04-pairing-origin-capabilities.md`
- Commands/events added: pairing/auth wire handling; `sdk:revoked` on revoke; `sdk:ping` success after auth only
- Security impact: fail-closed Origin/pairing/PoP/capabilities/replay/revoke; audit allowlist; no SIP teardown on revoke
- Regression risks: Origin required (DI-03 missing-Origin clients must send allowlisted Origin); empty allowlist rejects all upgrades
- Automated tests: focused DI-04 set 44 passed; full `npm test` 2385 passed / 1 skipped (re-verified by `/sdk-review`)
- Manual evidence: smoke not claimed
- Verification commands: focused vitest; `npm test`; `npm run lint`; `npm run typecheck`; `npm run registry:check`
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-04 → `done`
- Remaining risks: Settings UX (DI-09); product snapshots (DI-05); SDK-04 client auth package
- Evidence: `axatalk-sdk-integration/evidence/DI-04-pairing-origin-capabilities.md`
- Reviewer: `/sdk-review` **PASS** (2026-07-20) — no Blockers; High/Low remediations closed same day; next DI-05 via `/sdk-integration`

## DI-05 — Read-Only Snapshot, Events, and Window Show

Prerequisites: DI-04 and SDK-05 ready.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS (re-gate after typecheck remediation)

Agent prompt:

> Add per-client redacted snapshot and stable event delivery. Implement only window show as a
> mutation. Use an Application mapper for product state and main handler for native window
> state. Do not add call, operator, logout, or sign-in mutations.

Checklist:

- [x] snapshot assembler.
- [x] public call/registration/account/operator event mapper.
- [x] per-capability redaction.
- [x] per-client subscriptions; no broadcast.
- [x] sequence/revision and resync.
- [x] show/restore/focus policy and rate limit.
- [x] SIP-only and OCP-disabled tests.
- [ ] SDK-05 interoperability. *(paired client gate; desktop surface closed — client package still pending)*
- [x] `npm run typecheck` green. *(remediated 2026-07-20 — schema-valid `window:hide` deny fixture)*

### Handoff checklist (DI-05)

- Work unit: DI-05
- Prerequisites verified: DI-04 `done` (`/sdk-review` PASS); SDK-01…SDK-03 `done`; protocol fixtures consumed
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration (primary)
- Layers changed: Application mappers/handlers; gateway product dispatch; main window + IPC; renderer broker bind; preload
- Files added/changed:
  - Application: `ExternalSdkReadHandler.ts`, `ExternalSdkSnapshotAssembler.ts`, `ExternalSdkEventMapper.ts`, `sdkPrivacyRedaction.ts`, `readSdkProductStateFromStore.ts`
  - Gateway: `sdkGatewayProductDispatch.ts`, `sdkGatewaySnapshotMessage.ts`, `sdkGatewayEventFanout.ts`, `sdkGatewayWindowHandler.ts`, route/dispatch/registry/adapter
  - Main: `createSdkGatewayProductSurface.ts`, `registerSdkGateway.ts`
  - IPC/preload: `SdkGatewayEventContract.ts`, `publishSdkGatewayEvent`
  - evidence `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`
- Commands/events added: `sdk:get-snapshot` success; `window:show` / `window:get-state`; public event fan-out; `window:visibility-changed`
- Security impact: capability-gated read-only surface; redaction enforced; per-client events; revoke stops delivery; DI-04 invariants preserved
- Regression risks: additive product path; SIP/OCP/call untouched; F-011 not implemented
- Automated tests: focused DI-05 set **60 passed**; full `npm test` **2407 passed / 1 skipped**; `npm run lint` PASS; `npm run typecheck` PASS; `npm run registry:check` **71/0**
- Manual evidence: smoke not claimed
- Verification commands: focused vitest; `npm test`; `npm run lint`; `npm run typecheck`; `npm run registry:check`
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-05 → **`done`**
- Remaining risks: SDK-05 client interoperability; OCP enabled flag sampled at bind; post-auth auto-snapshot deferred
- Evidence: `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`
- Reviewer: `/sdk-review` **PASS** (2026-07-20 re-gate) — prior High remediated (`window:hide` fixture includes `expectedRevision`; typecheck green); ADR-0013 deny unchanged

## DI-06 — Call Command Router

Prerequisites: DI-05 done; SDK-06 ready.

Status: **`done`** (2026-07-20) — revision-contract remediation verified; High/Low closed

### Intake (DI-06)

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration (primary) + Telephony (existing Use Cases / Call Engine)
- Layers: Application call handler + ownership/revision; gateway route/dispatch; broker bind; tests/evidence
- Layers forbidden: Domain protocol imports; second Facade/Call Engine in main; DI-07/08 routers; transfer backlog
- Regression risks: DI-04 security; DI-05 privacy/snapshots; SIP-only; OCP optional; version stays `0.11.2`; F-011 stays `in progress`

Agent prompt:

> Route approved call commands through focused Application handlers and the existing Call
> Engine. Add aggregate serialization, ownership/revision checks, idempotency, and race tests.

Checklist:

- [x] originate.
- [x] answer/reject.
- [x] hang up.
- [x] hold/resume.
- [x] mute/unmute.
- [x] DTMF.
- [x] duplicate/conflict/stale/timeout/client-drop tests.
- [x] existing critical telephony suite remains green.

### Handoff checklist (DI-06)

- Work unit: DI-06
- Prerequisites verified: DI-00…DI-05 `done` (`/sdk-review` PASS); protocol call DTOs from SDK-02 consumed; SDK-06 client package may remain pending
- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration + Telephony
- Layers touched: Application call handler/ownership; gateway route/dispatch/dedup; broker IPC `clientId`; bind session; tests/evidence/docs
- Expected files:
  - `src/application/integration/ExternalSdkCallHandler.ts` (+ helpers/port/ownership/mutex/clock)
  - `src/application/integration/ExternalSdkProductHandler.ts`
  - `src/adapters/integration/sdkGatewayRouteInbound.ts`
  - `src/adapters/integration/sdkGatewayProductDispatch.ts`
  - `src/adapters/integration/sdkGatewayRequestDedup.ts`
  - `src/renderer/bootstrap/bindSdkBrokerSession.ts`
  - evidence `axatalk-sdk-integration/evidence/DI-06-call-command-router.md`
- Security impact: capability-gated call mutations; ownership/`expectedRevision`/idempotency server-side; DI-04/DI-05 invariants preserved; revoke stops further cmds without ending calls
- Regression risks: operator/account still `not_ready`; SDK-06 client interoperability residual
- Automated tests: focused DI set **81 passed**; full `npm test` **2428 passed / 1 skipped**; `npm run lint` PASS; `npm run typecheck` PASS; `npm run registry:check` **73/0**
- Manual smoke: deferred to DI-10 packaged gate
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-06 → **`done`**
- Remaining risks: SDK-06 client package; DI-07/08 routers; packaged E2E at DI-10
- Evidence: `axatalk-sdk-integration/evidence/DI-06-call-command-router.md`
- Reviewer: `/sdk-review` FAIL 2026-07-20 (revision contract High) → remediated same day; independent re-verify PASS (reply-chain + snapshot→mutate); DI-06 **`done`** (commit `6681118`)

## DI-07 — Operator Status and Logout Workflow

Prerequisites: DI-06 done; protocol operator/logout DTOs from SDK-02; SDK-07 client package may remain pending (mirror DI-05/DI-06).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Map public operator commands to existing F-028 Application behavior with `callType: "sdk"`.
> Implement prepare/confirm logout through the unified account logout orchestration and keep
> OCP optional.

Checklist:

- [x] operator state/reasons DTO mapper.
- [x] status changes.
- [x] prepare logout and interaction-required response.
- [x] confirm/cancel logout.
- [x] recovery disarm/reset preserved.
- [x] SIP-only, connected-only, authenticated, and failure paths.
- [x] no OCP wire objects cross the boundary.

### Handoff checklist (DI-07)

- Work unit: DI-07
- Prerequisites verified: DI-00…DI-06 `done` (`/sdk-review` PASS); protocol operator/logout DTOs from SDK-02; SDK-07 client package may remain pending
- Checklist: all items complete
- Evidence: `axatalk-sdk-integration/evidence/DI-07-operator-logout-workflow.md`
- Security impact: capability-gated operator/logout; public DTOs only; `interaction_required` details safe; DI-04/05/06 invariants preserved (revision peek on reads/prepare)
- Automated tests: focused DI-04…DI-07 + Low remediation green; full `npm test` **2458 passed / 1 skipped**; lint/typecheck PASS; `registry:check` **74/0**
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-07 → **`done`**
- Remaining risks: SDK-07 client package; DI-08 activate-profile; packaged E2E at DI-10
- Reviewer: `/sdk-review` PASS 2026-07-20 — DI-07 **`done`**; Lows remediated (callType binding test, shared-clock, disconnect clears pending logout); next `/sdk-integration` DI-08 only (separate session)

## DI-08 — Saved-Profile Activation

Prerequisites: DI-07 done; SDK-08 security approval (ADR-0013 §B + AF-003/005/006 Accepted; SDK-08 client package non-blocking).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Add privileged activation of desktop-approved saved profile references through the unified
> Account sign-in path. No secret may cross WS, IPC, DTO, event, projection, or logs.

Checklist:

- [x] opaque approved profile references.
- [x] privileged short-lived capability and local approval.
- [x] active-session lock.
- [x] desktop-only secret hydration.
- [x] revoke/expiry/race tests.
- [x] ADR-AF-003/005/006 regression tests.
- [x] security review passes. (`/sdk-review` PASS 2026-07-20 — Low hygiene only)

### Handoff checklist (DI-08)

- Work unit: DI-08
- Prerequisites verified: DI-00…DI-07 `done`; ADR-0013 §B + AF-003/005/006 Accepted; protocol `account:activate-profile` from SDK-02; SDK-08 client package may remain pending
- Status: **`done`**
- Evidence: `axatalk-sdk-integration/evidence/DI-08-saved-profile-activation.md`
- Security impact: capability + local-approval gated activate; secrets desktop-only; logout-first → `conflict`; DI-04…DI-07 invariants preserved
- Automated tests: focused DI-04…DI-08 **140 passed** (post-Low remediation); full `npm test` **2482 passed / 1 skipped**; lint/typecheck PASS; `registry:check` **74/0**
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-08 → **`done`**
- Remaining risks: Settings grant UX (DI-09); SDK-08 client package; packaged E2E at DI-10
- Reviewer: `/sdk-review` PASS 2026-07-20 — DI-08 **`done`**; Lows remediated same day (WS revoke/disconnect, OCP-disabled test, TTL cap strip, registry split); next `/sdk-integration` DI-09 only (separate session)

## DI-09 — Settings and Operational UX

Prerequisites: DI-04 stable; DI-05 operational requirements known.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Add the SDK Server settings surface using the UI Kit and all supported locales. Expose
> enablement, endpoint policy, exact origins, paired clients, revoke, status, and safe
> diagnostics. Do not expose reusable bearer secrets.

Checklist:

- [x] settings schema and migration.
- [x] Application commands/projections.
- [x] UI Kit-based integration card.
- [x] light/dark stories and tests.
- [x] accessibility and disabled reasons.
- [x] `ru`, `en`, `fr`, `de`, `bg` parity.
- [x] hide remains disabled until tray/policy ADR is implemented.

### Handoff checklist (DI-09)

- Work unit: DI-09
- Status: **`done`**
- Evidence: `axatalk-sdk-integration/evidence/DI-09-settings-operational-ux.md`
- Automated tests: focused DI-09 + DI-04…DI-08 subset **48 passed** (independent `/sdk-review` re-verify); full `npm test` **2491 passed / 1 skipped**; lint/typecheck/i18n/registry PASS
- Registry/Legacy/STATUS changes: F-011 remains `in progress`; DI-09 → **`done`**; version **0.11.2**
- Remaining risks: packaged E2E / hostile matrix (DI-10); SDK browser package may lag; machine-scoped gateway policy stored in account settings bucket
- Reviewer: `/sdk-review` PASS 2026-07-20 — DI-09 **`done`**; no Blockers; Lows remediated same day (deep IPC snapshot parse + card revoke/grant tests); next `/sdk-integration` DI-10 only (separate session)

## DI-10 — Compatibility, E2E, and P12 Close

Prerequisites: DI-01…DI-09 and SDK-00…SDK-09 done. (SDK-10 Mode A RC staging also `done`.)

Status: **`review`** (2026-07-21) — `/sdk-review` FAIL findings remediated (ESLint ignore + SDK-10 docs + Edge version + catalog); packaged handshake evidence real; F-011/P12 **not** closed; awaiting re-`/sdk-review`

### Intake (hard-stop cleared)

| Check | Required | Actual |
| --- | --- | --- |
| Desktop DI-00…DI-09 | `done` | **PASS** — all `done` |
| SDK-00…SDK-09 | `done` (or explicit human waiver) | **PASS** — SDK-09 `/sdk-review` PASS 2026-07-20 |
| SDK-10 Mode A | RC-ready / stable-blocked (optional for DI-10 intake) | **PASS** — `/sdk-review` PASS 2026-07-20; no npm `latest` |
| Explicit intake | `/sdk-integration` DI-10 only | **PASS** — this session |
| Desktop version | `0.11.2` until justified P12 close bump | **PASS** (`0.11.2`) |
| F-011 | stays `in progress` until real packaged evidence | **PASS** — unchanged (full smoke incomplete) |

Evidence: `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md`

Agent prompt:

> Execute the complete compatibility, security, regression, and packaged Electron E2E gates.
> Remediate failures without weakening policy. Close F-011/P12 and legacy coverage only when
> all evidence is real and independently reviewed.

Checklist:

- [x] complete automated preflight. *(remediated: ESLint ignore DI smoke scripts; re-verify counts in evidence)*
- [x] packaged Electron + supported browser E2E. *(PARTIAL — handshake/security subset PASS; pairing/call OPEN)*
- [x] old/new SDK-desktop matrix. *(PARTIAL — current+incompat PASS; prior published SDK N/A/OPEN)*
- [x] hostile-client security matrix. *(PASS automated + packaged Origin; live UI revoke OPEN)*
- [x] SIP-only/OCP/call/manual smoke. *(PARTIAL — automated independence cited; live OPEN)*
- [x] architecture, WU, and security reviews pass. *(self-check; formal `/sdk-review` re-requested after remediation; `/arch-review` deferred)*
- [x] F-011, LF-051/065/080/081, STATUS, roadmap, docs, and handoff updated. *(factual; F-011/LF/P12 not closed)*
- [x] rollback and client revocation verified. *(automated revoke PASS; packaged UI revoke OPEN)*

### Handoff checklist (DI-10)

- Work unit: DI-10
- Prerequisites verified: DI-00…DI-09 `done`; SDK-00…SDK-10 Mode A `done`; explicit intake
- Feature/LF IDs: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration
- Layers changed: tests + evidence/scripts/docs only (no production privilege change)
- Files added/changed: see evidence file
- Commands/events added: none
- Security impact: fortress + packaged Origin/incompat proven; no weaken
- Regression risks: none intentional; version remains `0.11.2`
- Automated tests: `LocalWsServerAdapter.compat.test.ts` + prior DI-03…09 suite; full preflight PASS
- Manual evidence: packaged win-unpacked 0.11.2 + Edge 150 smoke reports (partial checklist)
- Verification commands: `npm run release:preflight`; SDK `api:check`/`preflight`; `di10-*-smoke.mjs`
- Registry/Legacy/STATUS changes: F-011 stays `in progress`; P12 open; remaining gates listed
- Remaining risks / open: Settings pair/revoke live; SIP/OCP call smoke; prior SDK/desktop cells
- Evidence: `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md`
- Reviewer: `/sdk-review` FAIL (2026-07-21) → remediated same day; **re-request `/sdk-review` DI-10 only**
