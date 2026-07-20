# Axatalk SDK Work Units

## How to Use This Queue

1. Select the first `pending` work unit whose prerequisites are `done`.
2. Change only that work unit to `in progress`.
3. Execute its checklist and verification.
4. Add evidence paths and set it to `review`.
5. An independent reviewer sets it to `done` or returns it to `in progress`.

Allowed statuses: `pending`, `in progress`, `review`, `done`, `blocked`.

## Progress

- [ ] SDK-00 — Package workspace and CI (`pending`)
- [ ] SDK-01 — Protocol and security ADRs (`pending`)
- [ ] SDK-02 — `@axatalk/protocol` (`pending`)
- [ ] SDK-03 — Transport and connection state machine (`pending`)
- [ ] SDK-04 — Pairing, authentication, and capabilities (`pending`)
- [ ] SDK-05 — Read-only beta API (`pending`)
- [ ] SDK-06 — Call control API (`pending`)
- [ ] SDK-07 — Operator and logout workflows (`pending`)
- [ ] SDK-08 — Saved-profile activation (`pending`)
- [ ] SDK-09 — Developer documentation and examples (`pending`)
- [ ] SDK-10 — Release candidate and stable release (`pending`)

---

## SDK-00 — Package Workspace and CI

Prerequisites: planning documents approved.

Agent prompt:

> Initialize the Axatalk SDK npm workspace exactly as specified by SDK-00 in
> `docs/IMPLEMENTATION-PLAN.md`. Verify current official documentation and deprecation
> status before choosing tool versions. Do not create public API or publish packages.

Checklist:

- [ ] npm workspace created with protocol and SDK packages.
- [ ] strict shared and package TypeScript configurations added.
- [ ] ESM exports and declaration build configured.
- [ ] lint, typecheck, unit, type, API, package, browser, and preflight scripts added.
- [ ] CI uses clean install and uploads package tarballs without publishing.
- [ ] dependency purpose and runtime status documented.
- [ ] clean install and preflight pass.

Evidence:

- Workspace files:
- Verification output:
- Reviewer:

## SDK-01 — Protocol and Security ADRs

Prerequisites: SDK-00 done; desktop DI-00 done (**DI-00 `done`** — ADR-0009…0013 Accepted; close open rows O-* in `PROTOCOL.md`).

Agent prompt:

> Close the open decisions in `docs/PROTOCOL.md` with ADRs shared with the desktop
> integration track (respect desktop ADR-0009…0013 policy baselines). Perform browser
> feasibility spikes only; do not implement product APIs.

Checklist:

- [ ] schema source-of-truth decision.
- [ ] endpoint discovery and supported browser policy decision.
- [ ] pairing and proof-of-possession decision.
- [ ] PII redaction and capability matrix.
- [ ] command ownership, idempotency, and revision policy.
- [ ] protocol support and deprecation window.
- [ ] F-028 OCP command naming mapped without leaking OCP wire protocol.
- [ ] desktop reviewer approval recorded.

Evidence:

- ADRs:
- Browser spike:
- Reviewer:
- Desktop policy baseline: ADR-0009…0013 / P12 handoff open-decision table

## SDK-02 — Protocol Package

Prerequisites: SDK-01 and desktop DI-01 done.

Agent prompt:

> Implement `@axatalk/protocol` from the approved protocol ADRs. Treat every boundary value
> as unknown, provide runtime schemas and golden fixtures, and keep the package independent
> from SDK and desktop source.

Checklist:

- [ ] handshake/auth schemas.
- [ ] command/reply schemas.
- [ ] event/snapshot schemas.
- [ ] stable error and capability types.
- [ ] valid and invalid golden fixtures.
- [ ] compatibility helpers and API report.
- [ ] desktop consumes the same fixtures successfully.
- [ ] package and type tests pass.

Evidence:

- Public API report:
- Fixture paths:
- Desktop DI-02 evidence:

## SDK-03 — Transport and Connection State Machine

Prerequisites: SDK-02 done.

Agent prompt:

> Implement the internal transport port and explicit SDK connection state machine using a
> deterministic fake transport. Do not connect to a real desktop and do not add product methods.

Checklist:

- [ ] explicit states and legal transitions.
- [ ] request correlation and timeout cleanup.
- [ ] heartbeat and bounded jittered reconnect.
- [ ] abort/disconnect cleanup.
- [ ] no mutation replay.
- [ ] redaction-safe diagnostics.
- [ ] fake-time tests prove no resource leaks.

Evidence:

- State-machine tests:
- Resource-cleanup tests:
- Reviewer:

## SDK-04 — Pairing, Authentication, and Capabilities

Prerequisites: SDK-03 and desktop DI-04 done.

Agent prompt:

> Add protocol negotiation, pairing-required behavior, authenticated sessions, capability
> updates, revocation, and incompatibility handling. Use the desktop integration harness.

Checklist:

- [ ] version negotiation.
- [ ] challenge-response flow.
- [ ] pairing-required state and callback.
- [ ] capability projection.
- [ ] revoke and stale-instance handling.
- [ ] replay tests.
- [ ] no pre-auth snapshot/events.
- [ ] interoperability tests pass.

Evidence:

- Interoperability matrix:
- Security tests:
- Reviewer:

## SDK-05 — Read-Only Beta API

Prerequisites: SDK-04 and desktop DI-05 done.

Agent prompt:

> Implement the smallest useful read-only AxatalkClient API: lifecycle, snapshot,
> typed events, revision reconciliation, and window show when granted. Do not add call,
> operator, logout, or account mutations.

Checklist:

- [ ] side-effect-free constructor.
- [ ] connect/disconnect/getSnapshot.
- [ ] typed subscription and unsubscribe.
- [ ] redacted event map.
- [ ] sequence gap resync.
- [ ] reconnect snapshot replacement.
- [ ] window show capability.
- [ ] browser tests.

Evidence:

- API report:
- Browser matrix:
- Desktop DI-05 evidence:

## SDK-06 — Call Control API

Prerequisites: SDK-05 stable; desktop DI-06 done.

Agent prompt:

> Add call mutations in the approved order. For each command add capability, revision,
> timeout, conflict, and multi-tab tests. Never replay a command after reconnect.

Checklist:

- [ ] originate.
- [ ] answer/reject.
- [ ] hang up.
- [ ] hold/resume.
- [ ] mute/unmute.
- [ ] DTMF.
- [ ] conflict and stale-state errors.
- [ ] SDK disconnect leaves calls untouched.

Evidence:

- Command matrix:
- Race tests:
- Desktop mapping evidence:

## SDK-07 — Operator and Logout Workflows

Prerequisites: SDK-06; desktop DI-07 done.

Agent prompt:

> Add operator status and prepare/confirm logout workflows through public DTOs. OCP remains
> optional and its wire protocol must not enter the SDK.

Checklist:

- [ ] operator state and reasons.
- [ ] status change.
- [ ] prepare logout.
- [ ] interaction-required result.
- [ ] confirm/cancel logout.
- [ ] SIP-only behavior.
- [ ] OCP reason and recovery tests.

Evidence:

- Workflow tests:
- SIP-only regression evidence:
- Reviewer:

## SDK-08 — Saved-Profile Activation

Prerequisites: SDK-07; privileged security gate approved; desktop DI-08 done.

Agent prompt:

> Add activation of desktop-approved saved profile references without reading, accepting,
> storing, or returning SIP/OCP secrets.

Checklist:

- [ ] approved profile reference DTO.
- [ ] privileged capability and local approval.
- [ ] active-session conflict.
- [ ] revoke/expiry behavior.
- [ ] no secret fields in API report, fixtures, logs, or examples.
- [ ] security review passes.

Evidence:

- Secret scan:
- Security review:
- Desktop DI-08 evidence:

## SDK-09 — Documentation and Examples

Prerequisites: stable release-candidate API.

Agent prompt:

> Produce complete developer documentation and an example application against the fake peer.
> Every example must compile, be secure by default, and explain capability failures.

Checklist:

- [ ] installation and support matrix.
- [ ] pairing quick start.
- [ ] API, events, errors, and capabilities reference.
- [ ] reconnect and multi-tab guidance.
- [ ] logout workflow guide.
- [ ] security anti-patterns.
- [ ] upgrade/deprecation guide.
- [ ] example and documentation tests.

Evidence:

- Documentation index:
- Example CI:
- Reviewer:

## SDK-10 — Release Candidate and Stable Release

Prerequisites: all earlier SDK and desktop DI work units done.

Agent prompt:

> Prepare a release candidate using the approved release workflow. Do not promote to stable
> until packaged Electron E2E, compatibility, architecture, and security gates pass.

Checklist:

- [ ] clean-install preflight.
- [ ] package API and tarball checks.
- [ ] browser and SDK/desktop compatibility matrix.
- [ ] packaged Electron E2E.
- [ ] architecture review.
- [ ] security review.
- [ ] changelog, SBOM, provenance, rollback, and revoke procedure.
- [ ] release candidate validated before stable promotion.

Evidence:

- Release candidate:
- Gate reports:
- Stable release:
