# OmniCall Desktop SDK Integration Plan

> **Live status (2026-08-03):** F-011 **`implemented`**; P12 **closed**; corrective
> WU-00…WU-07 **PASS** — see `README.md` Current Status and
> `sdk-production-readiness/CLOSEOUT.md`. Phase narratives below are **historical**.
> Origin upgrade is **fail-closed** (`allowed` only; ADR-0018 amended 2026-08-03).

## Objective

Implement F-011/P12 as a secure vertical slice from Electron main transport to existing
Application behavior without regressions, duplicated state, or legacy browser globals.

## Required ADRs

DI-00 must add or amend ADRs for:

1. main/renderer ownership and broker lifecycle;
2. local transport, endpoint discovery, and browser support;
3. pairing, capabilities, Origin, replay, and revocation;
4. public protocol versioning and compatibility;
5. PII redaction and call ownership;
6. window show/hide policy;
7. SDK sign-in relationship to ADR-AF-003.

Raw credential sign-in is excluded from protocol v1. A later requirement needs a separate ADR.

## Target Components

Names are conceptual until DI-00 approves exact locations.

### Main / Infrastructure

- `LocalWsServerAdapter`
- connection/session registry
- pairing and capability service
- rate/resource limiter
- native window command handler
- main side of the typed external command broker

### Shared IPC / Protocol Boundary

- typed broker channels and envelopes
- runtime parsers for requests, replies, events, and teardown
- stable timeout and unavailable errors

### Renderer / Application

- renderer side of the broker
- `ExternalCommandRouter`
- focused command/query handlers
- `ExternalSdkEventMapper`
- external snapshot assembler
- command arbiter for aggregate serialization

### Settings

- SDK integration settings schema and migration
- Origin trust store: unknown / allowed / denied (blacklist) — ADR-0018
- Per-Origin capability matrix and paired clients
- pairing/revoke / activate-grant controls
- server diagnostics without secrets; **no** normal Settings toggle to stop the listener

## Dependency Direction

```text
LocalWsServerAdapter (main infrastructure)
  -> ExternalClientGateway port / transport service
  -> typed broker adapter
  -> ExternalCommandRouter (Application)
  -> focused handlers
  -> existing Facades / Use Cases / Call Engine
```

Native window commands may terminate in main after policy and capability checks. Product
commands may not terminate in main.

## Phase DI-00 — Architecture and Baseline

Status: **`done`** (2026-07-20). Evidence: `evidence/DI-00-baseline.md`. `/sdk-review` PASS.

- Created ADRs ADR-0009…0013 and detailed P12 handoff with DI-01…DI-10 gates.
- Captured automated preflight baseline and froze manual smoke checklist for later runs.
- Synchronized open protocol decisions with SDK-01 ownership IDs in `PROTOCOL.md`.
- Updated F-011 acceptance/planning refs and STATUS without claiming implementation.
- Defined process lifecycle for renderer reload, app quit, and desktop restart (ADR-0009).

Gate closed. SDK-00 `done`; SDK-01 ADR-0014…0017 `done` (`/sdk-review` PASS). DI-01 only after DI-00 + SDK-01.

## Phase DI-01 — Public Contracts and Ports

Status: **`done`** (2026-07-20). Evidence: `evidence/DI-01-protocol-ports-mocks.md`. `/sdk-review` PASS.

- Integrated `@softomnitel/omnicall-protocol` (file dep) without Domain imports.
- Defined external gateway/broker ports and command/query handler interfaces.
- Added mock gateway, broker, and handler doubles (fail-closed validators).
- Desktop consumes SDK-02 golden fixtures byte-identical (valid/invalid+meta).

Gate closed: contracts compile and test without Electron or real network.

## Phase DI-02 — Typed Main-to-Renderer Broker

Status: **`done`** (2026-07-20). Evidence: `evidence/DI-02-typed-main-renderer-broker.md`. `/sdk-review` PASS.

- Implemented request/reply correlation across process boundary (`MainToRendererBroker`).
- Validated payloads on main ingress, preload/IPC boundary, and renderer ingress.
- Defined startup readiness, renderer reload, timeout, cancellation, and shutdown behavior (ADR-0009).
- Kept preload API minimal (`onSdkBrokerRequest` / `replySdkBrokerRequest` / `setSdkBrokerReady`); no raw `ipcRenderer`.
- Proved one renderer Application probe handler receives every successful `sdk:ping`.

Gate closed. Post-review follow-ups closed: cancel-quit restores broker readiness; send/reload target the ready webContents.

## Phase DI-03 — Local Gateway Transport

Status: **`done`** (2026-07-20) — `/sdk-review` PASS. Evidence: `evidence/DI-03-loopback-websocket-transport.md`.

- Selected `ws@8.18.3` (`WebSocketServer`) after Context7 official-doc / deprecation check.
- Bound loopback-only with fail-closed occupied-port and single-instance ownership.
- Enforced frame/depth/connection/rate/queue/heartbeat/idle/handshake limits.
- Handshake + discovery only; product commands denied `unauthenticated`.
- Shutdown stops acceptance and disposes server/clients/timers without blocking SIP boot.

Gate: `/sdk-review` PASS (High/Low follow-ups non-blocking).

## Phase DI-04 — Pairing and Authorization

- Implement exact Origin policy.
- Add user/admin-approved per-client pairing.
- Store pairing secrets through `SecretStoragePort` or an approved dedicated secure service.
- Issue short sessions bound to Origin, client, server instance, and capabilities.
- Add nonce/replay, revoke, expiry, auth timeout, and audit events.
- Enforce capability on every command and subscription.

Gate: security suite passes and independent security review has no Blocker.

## Phase DI-05 — Read-Only Snapshot and Events

- Build a public snapshot assembler from Application projections/read models.
- Map stable call, registration, account, operator, and window facts to public DTOs.
- Redact per client capability.
- Deliver per-session subscriptions with sequence/revision.
- Implement resync on event gaps.
- Add `window:show` and window-state query in main under capability/rate policy.

Gate: read-only SDK-05 interoperability passes; no mutation commands.

## Phase DI-06 — Call Commands

Implement in order:

1. originate;
2. answer/reject;
3. hang up;
4. hold/resume;
5. mute/unmute;
6. DTMF.

For every command:

- validate public DTO;
- verify capability and ownership;
- serialize by call/account aggregate;
- map to existing Facade/Use Case/Call Engine;
- return typed result/error and revision;
- preserve correlation and safe logs;
- test duplicate, conflict, stale state, timeout, and client disconnect.

Gate: all call flows pass existing regression tests plus SDK command matrix.

## Phase DI-07 — Operator and Logout

- Reuse F-028 E-12 through an explicit public protocol mapper.
- Use `callType: "sdk"` for SDK-originated **Application** audit trail; OCP adapter maps
  wire `function_call_type` `sdk` → `external` (`mapOcpCallTypeToWire`) — never leak `"sdk"`
  onto the OCP socket (legacy accepts only `internal`|`external`).
- Expose operator status/reasons without OCP wire types.
- Implement single-shot account logout using `AccountLogoutOrchestrationService`.
- Return `interaction_required` when an OCP reason is needed (`requiresReason` + reasons; no `logoutToken`).
- Preserve intentional logout recovery disarm/reset semantics.

Gate: SIP-only, OCP live, connected-only, missing snapshot, cancel, and failure paths pass.

## Phase DI-08 — Saved-Profile Activation

- Expose only policy-approved opaque profile references.
- Require privileged short-lived capability and local approval.
- Delegate to the unified Account sign-in path.
- Preserve active-session logout-first lock.
- Keep all secrets inside desktop storage and Application boundaries.

Gate: no secret crosses protocol or logs; ADR-AF-003/005/006 regressions pass.

## Phase DI-09 — Settings and Operational UX

- Add SDK Server card under Settings → Integrations using UI Kit.
- Configure enabled state, endpoint/port policy, exact origins, paired clients, revoke,
  server status, and safe diagnostics.
- Add all translations for `ru`, `en`, `fr`, `de`, and `bg`.
- Never display reusable bearer secrets for copy/paste into browser bundles.
- `window:hide` product-available (ADR-0013 amended 2026-07-27): Origin matrix grant,
  telephony-busy deny, hide-only tray Show recovery — do not reintroduce permanent deny.

Gate: UI, accessibility, i18n, migration, and security tests pass.

## Phase DI-10 — Compatibility, E2E, and P12 Close

Status: **`done`** — full P12/F-011 close **2026-07-27** (evidence
`evidence/DI-10-compatibility-e2e-p12-close.md`). Packaged/browser smoke cells are
**archival**; agents must not re-run them as gates.

Historical mid-unit notes (partial smoke / `in progress`) below the full-close date are
superseded by STATUS.md + Feature Registry + corrective CLOSEOUT.

## Phase DI-11 — Origin Trust Store, Blacklist, Per-Origin Policy, Activate Consent

Status: **`done`** (`/sdk-review` PASS 2026-07-21; ADR-0018; evidence
`evidence/DI-11-origin-tofu-blacklist-activate.md`).

- Always-on loopback gateway; remove Settings listener enable toggle (env kill-switch only).
- Origin states unknown / allowed / denied; Settings Trusted/Blocked + matrix; blacklist
  upgrade reject; Unblock restore (prior allowed → allowed+matrix).
- **Post-DI-11 hardening (2026-08-03):** WebSocket upgrade accepts **`allowed` only**
  (fail-closed). First-contact TOFU-on-upgrade superseded — see ADR-0018 amendment.
- Per-Origin capability matrix; pre-auth Settings → OmniCall Kit (ADR-AF-004).
- Discovery CORS for unknown+allowed (onboarding read; does not grant WS); activate consent.
- Machine-common boot hydrate (`sdk-origin-trust.json`); denied wins over env seed.

Gate closed for DI-11. F-011/P12 closed; corrective track WU-07 PASS 2026-08-03.

## Rollback and Failure Policy

- Engineering kill-switch `OMNICALL_SDK_GATEWAY=0` may stop the listener without affecting
  core softphone startup (not a normal Settings toggle — ADR-0018).
- Gateway startup failure is observable but does not block SIP-only operation.
- Revoking a client does not terminate calls or account sessions.
- Blacklisting an Origin rejects future upgrades without tearing SIP/account sessions.
- Renderer reload rejects pending external requests and forces clients to resync.
- Protocol incompatibility returns a safe error before state disclosure.
- Desktop shutdown closes gateway acceptance before telephony cleanup begins.
