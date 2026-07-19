# Desktop SDK Integration Work Units

## Progress

- [ ] DI-00 — ADRs, baseline, and P12 handoff (`pending`)
- [ ] DI-01 — Protocol contracts, ports, and mocks (`pending`)
- [ ] DI-02 — Typed main-to-renderer broker (`pending`)
- [ ] DI-03 — Loopback WebSocket transport (`pending`)
- [ ] DI-04 — Pairing, Origin, capabilities, and revocation (`pending`)
- [ ] DI-05 — Read-only snapshot, events, and window show (`pending`)
- [ ] DI-06 — Call command router (`pending`)
- [ ] DI-07 — Operator status and logout workflow (`pending`)
- [ ] DI-08 — Saved-profile activation (`pending`)
- [ ] DI-09 — Settings and operational UX (`pending`)
- [ ] DI-10 — Compatibility, E2E, and P12 close (`pending`)

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

Agent prompt:

> Prepare the architecture gate for F-011/P12. Create the required ADRs and a detailed
> handoff from `IMPLEMENTATION-PLAN.md`, synchronize decisions with SDK-01, capture current
> preflight and manual regression baseline, and update F-011 planning references. Write no
> production code and install no dependencies.

Checklist:

- [ ] process ownership and broker lifecycle ADR.
- [ ] transport/browser discovery ADR.
- [ ] pairing/capability/replay ADR.
- [ ] protocol/version/privacy/ownership ADR.
- [ ] window policy and SDK sign-in relationship ADR.
- [ ] P12 handoff with DI-01…DI-10 gates.
- [ ] automated and manual baseline recorded.
- [ ] architecture review passes.

## DI-01 — Protocol Contracts, Ports, and Mocks

Prerequisites: DI-00 and SDK-01 done.

Agent prompt:

> Add the protocol boundary, focused ports, parsers, and test doubles. Keep Domain and UI
> independent from protocol and Electron. Do not add IPC or a network server.

Checklist:

- [ ] protocol package/fixture integration.
- [ ] external gateway and broker ports.
- [ ] command/query handler interfaces.
- [ ] mock gateway and broker.
- [ ] valid/invalid fixture tests.
- [ ] dependency-boundary tests.
- [ ] F-011 remains `in progress`, not implemented.

## DI-02 — Typed Main-to-Renderer Broker

Prerequisites: DI-01 done.

Agent prompt:

> Implement and test the narrow main-to-renderer request/reply broker. Route product commands
> to the single existing renderer Application composition. Do not add network transport or
> product commands.

Checklist:

- [ ] typed shared IPC channels/envelopes.
- [ ] runtime validation on every boundary.
- [ ] minimal preload exposure.
- [ ] readiness, timeout, cancellation, reload, and shutdown behavior.
- [ ] pending-request cleanup.
- [ ] no raw `ipcRenderer`.
- [ ] no second Facade/composition.

## DI-03 — Loopback WebSocket Transport

Prerequisites: DI-02 done.

Agent prompt:

> Implement a handshake-only loopback WebSocket adapter in Electron main. Verify official
> dependency documentation and deprecation status first. Add single-instance ownership,
> resource limits, teardown, and abuse tests. Expose no product snapshot or command.

Checklist:

- [ ] maintained dependency selected and justified.
- [ ] loopback-only binding.
- [ ] single-instance lock and occupied-port failure.
- [ ] frame/depth/connection/rate/queue limits.
- [ ] heartbeat and auth timeout.
- [ ] deterministic teardown.
- [ ] unauthenticated product access impossible.

## DI-04 — Pairing, Origin, Capabilities, and Revocation

Prerequisites: DI-03 and SDK-04 protocol side ready.

Agent prompt:

> Implement exact Origin checks, approved per-client pairing, authenticated sessions,
> capability enforcement, replay protection, expiry, and revocation. Do not expose product
> commands beyond the handshake test command.

Checklist:

- [ ] exact Origin allowlist.
- [ ] local/admin approval.
- [ ] secure per-client storage.
- [ ] nonce/request replay protection.
- [ ] capability check per command/subscription.
- [ ] revoke and expiry.
- [ ] safe audit logs.
- [ ] independent security review passes.

## DI-05 — Read-Only Snapshot, Events, and Window Show

Prerequisites: DI-04 and SDK-05 ready.

Agent prompt:

> Add per-client redacted snapshot and stable event delivery. Implement only window show as a
> mutation. Use an Application mapper for product state and main handler for native window
> state. Do not add call, operator, logout, or sign-in mutations.

Checklist:

- [ ] snapshot assembler.
- [ ] public call/registration/account/operator event mapper.
- [ ] per-capability redaction.
- [ ] per-client subscriptions; no broadcast.
- [ ] sequence/revision and resync.
- [ ] show/restore/focus policy and rate limit.
- [ ] SIP-only and OCP-disabled tests.
- [ ] SDK-05 interoperability.

## DI-06 — Call Command Router

Prerequisites: DI-05 done; SDK-06 ready.

Agent prompt:

> Route approved call commands through focused Application handlers and the existing Call
> Engine. Add aggregate serialization, ownership/revision checks, idempotency, and race tests.

Checklist:

- [ ] originate.
- [ ] answer/reject.
- [ ] hang up.
- [ ] hold/resume.
- [ ] mute/unmute.
- [ ] DTMF.
- [ ] duplicate/conflict/stale/timeout/client-drop tests.
- [ ] existing critical telephony suite remains green.

## DI-07 — Operator Status and Logout Workflow

Prerequisites: DI-06 done; SDK-07 ready.

Agent prompt:

> Map public operator commands to existing F-028 Application behavior with `callType: "sdk"`.
> Implement prepare/confirm logout through the unified account logout orchestration and keep
> OCP optional.

Checklist:

- [ ] operator state/reasons DTO mapper.
- [ ] status changes.
- [ ] prepare logout and interaction-required response.
- [ ] confirm/cancel logout.
- [ ] recovery disarm/reset preserved.
- [ ] SIP-only, connected-only, authenticated, and failure paths.
- [ ] no OCP wire objects cross the boundary.

## DI-08 — Saved-Profile Activation

Prerequisites: DI-07 done; SDK-08 security approval.

Agent prompt:

> Add privileged activation of desktop-approved saved profile references through the unified
> Account sign-in path. No secret may cross WS, IPC, DTO, event, projection, or logs.

Checklist:

- [ ] opaque approved profile references.
- [ ] privileged short-lived capability and local approval.
- [ ] active-session lock.
- [ ] desktop-only secret hydration.
- [ ] revoke/expiry/race tests.
- [ ] ADR-AF-003/005/006 regression tests.
- [ ] security review passes.

## DI-09 — Settings and Operational UX

Prerequisites: DI-04 stable; DI-05 operational requirements known.

Agent prompt:

> Add the SDK Server settings surface using the UI Kit and all supported locales. Expose
> enablement, endpoint policy, exact origins, paired clients, revoke, status, and safe
> diagnostics. Do not expose reusable bearer secrets.

Checklist:

- [ ] settings schema and migration.
- [ ] Application commands/projections.
- [ ] UI Kit-based integration card.
- [ ] light/dark stories and tests.
- [ ] accessibility and disabled reasons.
- [ ] `ru`, `en`, `fr`, `de`, `bg` parity.
- [ ] hide remains disabled until tray/policy ADR is implemented.

## DI-10 — Compatibility, E2E, and P12 Close

Prerequisites: DI-01…DI-09 and SDK-00…SDK-09 done.

Agent prompt:

> Execute the complete compatibility, security, regression, and packaged Electron E2E gates.
> Remediate failures without weakening policy. Close F-011/P12 and legacy coverage only when
> all evidence is real and independently reviewed.

Checklist:

- [ ] complete automated preflight.
- [ ] packaged Electron + supported browser E2E.
- [ ] old/new SDK-desktop matrix.
- [ ] hostile-client security matrix.
- [ ] SIP-only/OCP/call/manual smoke.
- [ ] architecture, WU, and security reviews pass.
- [ ] F-011, LF-051/065/080/081, STATUS, roadmap, docs, and handoff updated.
- [ ] rollback and client revocation verified.
