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
- [x] SDK-04 — Pairing, authentication, and capabilities (`done`)
- [x] SDK-05 — Read-only beta API (`done`)
- [x] SDK-06 — Call control API (`done`)
- [x] SDK-07 — Operator and logout workflows (`done`)
- [x] SDK-08 — Saved-profile activation (`done`)
- [x] SDK-09 — Developer documentation and examples (`done`)
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

Status: **`done`** (2026-07-20)

Agent prompt:

> Add protocol negotiation, pairing-required behavior, authenticated sessions, capability
> updates, revocation, and incompatibility handling. Use the desktop integration harness.

Checklist:

- [x] version negotiation.
- [x] challenge-response flow.
- [x] pairing-required state and callback.
- [x] capability projection.
- [x] revoke and stale-instance handling.
- [x] replay tests.
- [x] no pre-auth snapshot/events.
- [x] interoperability tests pass.

Evidence:

- Interoperability matrix: `axatalk-sdk/evidence/SDK-04-pairing-auth-capabilities.md`
- Security tests: `packages/sdk/src/public/auth-client.test.ts`, `packages/sdk/src/internal/pop-crypto.test.ts`
- Public API report: `axatalk-sdk/etc/api/sdk.api.md` (auth lifecycle; no `AxatalkClient`)
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — zero Blockers; Lows remediated same day (orchestrator split; IndexedDB Node+Chromium coverage). Post-fix: sdk src **36**, workspace **44**, browser **3**, types **4**, api **28**, desktop PoP oracle **11**; DI-10 still blocked on SDK-05…09; next `/sdk-project` SDK-05 only

## SDK-05 — Read-Only Beta API

Prerequisites: SDK-04 and desktop DI-05 done.

Status: **`done`** (2026-07-20) — `/sdk-review` **PASS** after refactor re-gate.

Agent prompt:

> Implement the smallest useful read-only AxatalkClient API: lifecycle, snapshot,
> typed events, revision reconciliation, and window show when granted. Do not add call,
> operator, logout, or account mutations.

Checklist:

- [x] side-effect-free constructor.
- [x] connect/disconnect/getSnapshot. *(incl. no-hang + revision-bound success)*
- [x] typed subscription and unsubscribe.
- [x] redacted event map.
- [x] sequence gap resync.
- [x] reconnect snapshot replacement.
- [x] window show capability.
- [x] browser tests.
- [x] invalidate/disconnect rejects in-flight getSnapshot.
- [x] mismatched/missing snapshot revision never returns stale cache as success.

Evidence:

- Unit evidence: `axatalk-sdk/evidence/SDK-05-read-only-beta-api.md`
- API report: `axatalk-sdk/etc/api/sdk.api.md` (read-only `AxatalkClient`, **37** symbols)
- Browser matrix: Chromium via `AXATALK_SDK_BROWSER=1 npm run test:browser` (**4** tests)
- Desktop DI-05 evidence: `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`

- Reviewer: `/sdk-review` **PASS** 2026-07-20 (re-gate) — prior FAIL remediations verified; zero Blockers; independent: sdk src **51**, workspace **59**, types **5**, browser **4**, api **37**, desktop oracle **13**; F-011 remains `in progress`; DI-10 still blocked on SDK-06…09; next `/sdk-project` SDK-06 only

## SDK-06 — Call Control API

Prerequisites: SDK-05 stable; desktop DI-06 done.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Add call mutations in the approved order. For each command add capability, revision,
> timeout, conflict, and multi-tab tests. Never replay a command after reconnect.

Checklist:

- [x] originate.
- [x] answer/reject.
- [x] hang up.
- [x] hold/resume.
- [x] mute/unmute.
- [x] DTMF.
- [x] conflict and stale-state errors.
- [x] SDK disconnect leaves calls untouched.
- [x] reconnect does not replay call mutations.
- [x] SDK-05 snapshot/window/auth regressions green.
- [x] browser coverage for call path (minimal).
- [x] api-check / package-check updated.

Evidence:

- Unit evidence: `axatalk-sdk/evidence/SDK-06-call-control-api.md`
- Command matrix: same (table + DI-06 citation)
- Race tests: reconnect non-replay; disconnect-no-hangup; stale_state/conflict/not_owner; pre-ready/forbidden
- Desktop mapping evidence: DI-06 oracle **17** tests green (read-only); client is protocol consumer only
- Independent verification (implementation session): sdk src **66**, workspace preflight **74**, types **5**, browser **5**, api **39** (was **37**), desktop oracle **17**
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — zero Blockers; Low remediated same day (malformed callId → `invalid_payload`); independent post-fix: sdk src **67**, workspace **75**, types **5**, browser **5**, api **39**, desktop oracle **17**; F-011 remains `in progress`; DI-10 still blocked on SDK-07…09; next `/sdk-project` SDK-07 only
- Explicit non-goals: no SDK-07; F-011 not `implemented`; DI-10 still blocked on SDK-07…09

## SDK-07 — Operator and Logout Workflows

Prerequisites: SDK-06; desktop DI-07 done.

Agent prompt:

> Add operator status and prepare/confirm logout workflows through public DTOs. OCP remains
> optional and its wire protocol must not enter the SDK.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Public API (namespaced only):

```ts
client.operator.getReasons()
client.operator.changeStatus({ target, reasonId?, expectedRevision })
client.account.prepareLogout({ expectedRevision })
client.account.confirmLogout({ logoutToken, reasonId?, expectedRevision })
```

Command matrix: `operator:get-reasons` / `operator:change-status` / `account:prepare-logout` /
`account:confirm-logout`. Cancel = abandon token / disconnect (no invent `account:cancel-logout`).

Non-goals held: SDK-08 activate; window.hide; campaigns; OCP wire; desktop `src/`; npm publish;
auto-retry; confirm-on-disconnect; root-level mutations.

Checklist:

- [x] operator state and reasons.
- [x] status change.
- [x] prepare logout.
- [x] interaction-required result.
- [x] confirm/cancel logout.
- [x] SIP-only behavior.
- [x] OCP reason and recovery tests.
- [x] reconnect does not replay operator/logout mutations.
- [x] SDK disconnect does not logout / does not tear SIP.
- [x] SDK-05/SDK-06 regressions green.
- [x] browser coverage (minimal).
- [x] api-check / package-check updated.

Evidence:

- Unit evidence: `axatalk-sdk/evidence/SDK-07-operator-logout-workflows.md`
- Workflow tests: `packages/sdk/src/public/axatalk-client.operator.test.ts` (+ browser operator path)
- SIP-only regression evidence: empty reasons / `not_found` status / prepare-without-interaction in operator tests
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — zero Blockers; Low remediated same day (operator `conflict` test); independent post-fix: sdk src **88**, workspace **96**, types **6**, browser **6**, api **46**, desktop oracle **33**; F-011 remains `in progress`; DI-10 still blocked on SDK-08…09; next `/sdk-project` SDK-08 only
- Explicit non-goals: no SDK-08; F-011 not `implemented`; DI-10 still blocked on SDK-08…09

## SDK-08 — Saved-Profile Activation

Prerequisites: SDK-07; privileged security gate approved; desktop DI-08 done.

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Add activation of desktop-approved saved profile references without reading, accepting,
> storing, or returning SIP/OCP secrets.

Public API (namespaced only):

```ts
client.account.activateProfile({ profileRef, expectedRevision })
```

Command: `account:activate-profile` · Capability: privileged `account.activate` (server-granted
only; never client-default-requestable via `sanitizeRequestedCapabilities`).

Non-goals held: SDK-09 docs; npm publish; F-011 `implemented`; `window.hide`; raw credentials;
desktop `src/` edits; campaign events; invent `account:list-profiles`; pairing escalate;
auto-replay on reconnect; activate/hangup/confirm-logout on disconnect.

Checklist:

- [x] approved profile reference DTO.
- [x] privileged capability and local approval.
- [x] active-session conflict.
- [x] revoke/expiry behavior.
- [x] no secret fields in API report, fixtures, logs, or examples.
- [x] security review passes. *(`/sdk-review` PASS 2026-07-20)*

Evidence:

- Unit evidence: `axatalk-sdk/evidence/SDK-08-saved-profile-activation.md`
- Workflow tests: `packages/sdk/src/public/axatalk-client.activate.test.ts` (+ browser activate path)
- Secret scan: `api:check` + diagnostics privacy tests (no password/apiKey in API report; needles absent)
- Security review: `/sdk-review` **PASS** 2026-07-20
- Desktop DI-08 evidence: `axatalk-sdk-integration/evidence/DI-08-saved-profile-activation.md`
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — zero Blockers; Low remediated same day (mid-flight `disconnect()` activate reject); post-fix independent: sdk src **106**, workspace **114**, types **6**, browser **7**, api **47**, protocol **169**, desktop oracle **9**; F-011 remains `in progress`; DI-10 still blocked on SDK-09; next `/sdk-project` SDK-09 only
- Explicit non-goals: no SDK-09 ship in this unit; F-011 not `implemented`; DI-10 still blocked on SDK-09


## SDK-09 — Documentation and Examples

Prerequisites: stable release-candidate API (SDK-00…SDK-08 `done`).

Status: **`done`** (2026-07-20) — `/sdk-review` PASS

Agent prompt:

> Produce complete developer documentation and an example application against the fake peer.
> Every example must compile, be secure by default, and explain capability failures.

Public surface documented: `etc/api/sdk.api.md` — **47** symbols (unchanged).
No new public methods. Privileged strip unchanged. Fake peer not packed.

Non-goals held: SDK-10; npm publish; F-011 `implemented`; DI-10 unblock; desktop `src/`;
`window.hide` as available; invent `account:list-profiles`; pairing escalate for
`account.activate`; raw credential APIs; mutation replay / disconnect hangup helpers.

Checklist:

- [x] installation and support matrix.
- [x] pairing quick start.
- [x] API, events, errors, and capabilities reference.
- [x] reconnect and multi-tab guidance.
- [x] logout workflow guide.
- [x] security anti-patterns.
- [x] upgrade/deprecation guide.
- [x] example and documentation tests.

Evidence:

- Documentation index: `docs/guide/README.md`
- Example CI: `examples/crm-pairing-lite/` + `packages/sdk/src/docs/` + `npm run docs:check`
- Unit evidence: `axatalk-sdk/evidence/SDK-09-developer-docs-examples.md`
- Verification (implementation session): sdk src **113**, workspace **121**, types **7**, browser **7**, api **47**, protocol **169**
- Reviewer: `/sdk-review` **PASS** 2026-07-20 — zero Blockers; Lows remediated same day (Web Storage runtime detect + API inventory 47); post-fix: sdk src **115**, workspace **123**, types **7**, browser **7**, api **47**, protocol **169**, docs:check PASS; F-011 remains `in progress`; DI-10 still blocked (not auto-started); next `/sdk-project` SDK-10 only

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
