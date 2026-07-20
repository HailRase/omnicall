# Axatalk SDK Work Units

## How to Use This Queue

1. Select the first `pending` work unit whose prerequisites are `done`.
2. Change only that work unit to `in progress`.
3. Execute its checklist and verification.
4. Add evidence paths and set it to `review`.
5. An independent reviewer sets it to `done` or returns it to `in progress`.

Allowed statuses: `pending`, `in progress`, `review`, `done`, `blocked`.

## Progress

- [x] SDK-00 — Package workspace and CI (`done`)
- [x] SDK-01 — Protocol and security ADRs (`done`)
- [x] SDK-02 — `@axatalk/protocol` (`done`)
- [x] SDK-03 — Transport and connection state machine (`done`)
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

- [x] npm workspace created with protocol and SDK packages.
- [x] strict shared and package TypeScript configurations added.
- [x] ESM exports and declaration build configured.
- [x] lint, typecheck, unit, type, API, package, browser, and preflight scripts added.
- [x] CI uses clean install and uploads package tarballs without publishing.
- [x] dependency purpose and runtime status documented.
- [x] clean install and preflight pass.

Evidence:

- Workspace files: `axatalk-sdk/package.json`, `packages/protocol`, `packages/sdk`, `docs/DEPENDENCIES.md`
- Verification output: `axatalk-sdk/evidence/SDK-00-workspace.md`
- CI: `.github/workflows/axatalk-sdk-ci.yml`
- API reports: `axatalk-sdk/etc/api/protocol.api.md`, `axatalk-sdk/etc/api/sdk.api.md`
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — clean `npm ci` + `preflight` verified; CI browser path PASS; no publish; no public API; O-* untouched; desktop `src/` untouched. Low: deferred browser matrix; root `package-lock.json` version noise unrelated to SDK packages.

## SDK-01 — Protocol and Security ADRs

Prerequisites: SDK-00 done; desktop DI-00 done (**DI-00 `done`** — ADR-0009…0013 Accepted; close open rows O-* in `PROTOCOL.md`).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Close the open decisions in `docs/PROTOCOL.md` with ADRs shared with the desktop
> integration track (respect desktop ADR-0009…0013 policy baselines). Perform browser
> feasibility spikes only; do not implement product APIs.

Checklist:

- [x] schema source-of-truth decision. *(ADR-0014 — Zod)*
- [x] endpoint discovery and supported browser policy decision. *(ADR-0015 + browser spike)*
- [x] pairing and proof-of-possession decision. *(ADR-0016)*
- [x] PII redaction and capability matrix. *(ADR-0017 PII + ADR-0016 profiles)*
- [x] command ownership, idempotency, and revision policy. *(ADR-0017)*
- [x] protocol support and deprecation window. *(ADR-0017)*
- [x] F-028 OCP command naming mapped without leaking OCP wire protocol. *(ADR-0017 O-OCP-1)*
- [x] desktop reviewer approval recorded. *(`/sdk-review` PASS 2026-07-20)*

Evidence:

- ADRs: `docs/softphone/adr/ADR-0014` … `ADR-0017` (amendments on ADR-0010/0011/0012)
- Browser spike: `axatalk-sdk/evidence/SDK-01-browser-spike.md`
- Unit evidence: `axatalk-sdk/evidence/SDK-01-protocol-adrs.md`
- Fixtures format: `axatalk-sdk/docs/COMPATIBILITY-FIXTURES.md`
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — all O-* closed; no product API/Zod install/`src/`; preflight PASS; Low: interactive LNA deferred to SDK-05/DI-10; Zod size to SDK-02
- Desktop policy baseline: ADR-0009…0013 + ADR-0014…0017 / P12 handoff closed O-* table

## SDK-02 — Protocol Package

Prerequisites: SDK-01 done; desktop DI-01 listed as peer consumer (DI-01 still `pending` —
fixtures + consume contract ship here; desktop load evidence is a DI-01 checklist item).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Implement `@axatalk/protocol` from the approved protocol ADRs. Treat every boundary value
> as unknown, provide runtime schemas and golden fixtures, and keep the package independent
> from SDK and desktop source.

Checklist:

- [x] handshake/auth schemas.
- [x] command/reply schemas.
- [x] event/snapshot schemas.
- [x] stable error and capability types.
- [x] valid and invalid golden fixtures.
- [x] compatibility helpers and API report.
- [x] desktop consumes the same fixtures successfully. *(closed by DI-01 — `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md`; byte-identical corpus under `packages/protocol/fixtures/**`)*
- [x] package and type tests pass.

Evidence:

- Public API report: `axatalk-sdk/etc/api/protocol.api.md`
- Fixture paths: `axatalk-sdk/packages/protocol/fixtures/`
- Unit evidence: `axatalk-sdk/evidence/SDK-02-protocol-package.md`
- Desktop DI-01 consume: documented in evidence (DI-01 still `pending`; not faked)
- Desktop DI-02 evidence: N/A
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — independent rebuild/tests/lint/preflight PASS; zod@4.4.3 protocol-only; fixtures byte-stable; no AxatalkClient; DI-01 consume honesty OK. Post-review fix: CapabilityIdList on permission-changed; WireJsonObjectSchema for reply/error maps; `@public` tags; unknown-key strip + extra fixtures.

## SDK-03 — Transport and Connection State Machine

Prerequisites: SDK-02 done.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Implement the internal transport port and explicit SDK connection state machine using a
> deterministic fake transport. Do not connect to a real desktop and do not add product methods.

Checklist:

- [x] explicit states and legal transitions.
- [x] request correlation and timeout cleanup.
- [x] heartbeat and bounded jittered reconnect.
- [x] abort/disconnect cleanup.
- [x] no mutation replay.
- [x] redaction-safe diagnostics.
- [x] fake-time tests prove no resource leaks.

Evidence:

- State-machine tests: `packages/sdk/src/internal/connection-state.test.ts`, `connection-session.test.ts`
- Resource-cleanup tests: `packages/sdk/src/internal/connection-session.test.ts` (timers/listeners/pending)
- Unit evidence: `axatalk-sdk/evidence/SDK-03-transport-state-machine.md`
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — independent re-run: `npx vitest run packages/sdk/src` (18), `npm run lint`, `npm run preflight` PASS; public `@axatalk/sdk` surface empty; fake transport only; mutation non-replay + diagnostics redaction + leak proofs verified. Post-review Low fixes: FakeTransport excluded from pack; payload-free mutation counter.

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
