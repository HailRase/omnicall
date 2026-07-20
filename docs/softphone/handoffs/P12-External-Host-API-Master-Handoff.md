# P12 External Host API and Axatalk SDK — Master Handoff

## Status

| Field | Value |
| --- | --- |
| Feature | F-011 Host Integration Contract |
| Legacy | LF-051, LF-065, LF-080, LF-081 |
| Phase | P12 External Host API Compatibility |
| Feature status | **planned** (architecture gate DI-00 `done`; not implemented) |
| Branch | `feature/axatalk-sdk` |
| Desktop version | `0.11.2` |
| Code preflight commit | `5114c02` |
| DI-00 docs commit | `18fb3f1` |
| DI-00 | `done` — `/sdk-review` PASS 2026-07-20 |
| SDK-00 | `done` — `/sdk-review` PASS 2026-07-20 |
| Next | **SDK-01** (shared open rows O-*); DI-01 after DI-00 + SDK-01 |

## Mission

Replace the rejected legacy `window.Softphone` embed API with a secure, versioned browser
SDK and Electron-native local gateway while preserving every existing softphone behavior.

## Execution Packages

| Package | Path |
| --- | --- |
| SDK project | `axatalk-sdk/README.md` |
| SDK work units | `axatalk-sdk/docs/WORK-UNITS.md` |
| Desktop integration | `axatalk-sdk-integration/README.md` |
| Desktop work units | `axatalk-sdk-integration/WORK-UNITS.md` |
| Test matrix | `axatalk-sdk-integration/TEST-MATRIX.md` |
| Manual smoke | `axatalk-sdk-integration/SMOKE-CHECKLIST.md` |
| Baseline snapshot | `axatalk-sdk-integration/00-SNAPSHOT.md` |
| DI-00 evidence | `axatalk-sdk-integration/evidence/DI-00-baseline.md` |

## Architecture Decisions (DI-00)

| ADR | Topic | Status |
| --- | --- | --- |
| [ADR-0009](../adr/ADR-0009-sdk-process-ownership-broker-lifecycle.md) | Main/renderer ownership + broker lifecycle | Accepted |
| [ADR-0010](../adr/ADR-0010-sdk-local-transport-endpoint-discovery.md) | Loopback transport, discovery, browsers | Accepted + open rows → SDK-01 |
| [ADR-0011](../adr/ADR-0011-sdk-pairing-origin-capabilities.md) | Origin, pairing, capabilities, replay, revoke | Accepted + PoP detail → SDK-01 |
| [ADR-0012](../adr/ADR-0012-sdk-protocol-versioning-privacy-ownership.md) | Versioning, privacy, call ownership | Accepted + precision → SDK-01 |
| [ADR-0013](../adr/ADR-0013-sdk-window-policy-and-signin.md) | Window show/hide + AF-003 sign-in relationship | Accepted |

### Architecture non-negotiables (gate)

- [x] WebSocket server and native window actions are owned by Electron main (ADR-0009/0010/0013).
- [x] Existing Facades, Call Engine, SIP/OCP sessions, and projections remain in the single
  renderer Application composition (ADR-0009).
- [x] One typed validated broker connects main to that composition (ADR-0009).
- [x] No second Facade or telephony composition exists in main (ADR-0009).
- [x] Product commands terminate in focused Application handlers / Facades / Use Cases (ADR-0009).
- [x] Call commands always pass through Call Engine (ADR-0009).
- [x] OCP remains optional and SIP-only remains fully functional (ADR-0009/0013).
- [x] Public DTOs do not expose internal Domain Events, JsSIP, OCP wire, React, or stores (ADR-0012).
- [x] No `window.Softphone`, DOM CustomEvent host bus, or raw SIP/OCP credentials in protocol v1 (ADR-0011/0013).

### Security gate (policy closed; implementation later)

- [x] Loopback-only endpoint and single-instance ownership (ADR-0010) — implement DI-03.
- [x] Exact Origin gate before data exchange (ADR-0011) — implement DI-04.
- [x] Per-client pairing, capabilities, expiry, and revocation (ADR-0011) — implement DI-04.
- [x] Replay/idempotency and aggregate command serialization (ADR-0011/0012) — implement DI-04/06.
- [x] Resource limits, heartbeat, backpressure, and safe teardown (ADR-0010) — implement DI-03.
- [x] Per-client redacted events; no indiscriminate broadcast (ADR-0012) — implement DI-05.
- [x] No raw SIP/OCP credentials in protocol v1 (ADR-0013).
- [ ] Independent security review has no Blocker — **DI-04 / DI-10**.

### Open decisions shared with SDK-01

Recorded in ADR-0010/0011/0012 and `axatalk-sdk/docs/PROTOCOL.md`. Desktop must not invent
them in production code. Summary:

| ID | Topic | Owner | Blocks |
| --- | --- | --- | --- |
| O-DISC-1/2 | Discovery URL/schema vs HTTP helper | SDK-01 | DI-03 endpoint publish |
| O-BRW-1/2 | Browser HTTPS→loopback WS matrix + PNA UX | SDK-01 → DI-09 | SDK-05 / DI-09 |
| O-POP-1/2 | Proof-of-possession + pairing ceremony | SDK-01 + DI-04 | DI-04 |
| O-CAP-1 | Default capability profiles | SDK-01 + DI-04 | DI-04 |
| O-SCHEMA-1 | Runtime schema library / generation | SDK-01 | SDK-02, DI-01 |
| O-PII-1 | Exact PII mask levels | SDK-01 | DI-05 |
| O-OWN-1 | Call ownership/lease timers | SDK-01 | DI-06 |
| O-CAMP-1 | Campaign events in v1? | SDK-01 | DI-05 |
| O-OCP-1 | Public operator names vs F-028 E-12 | SDK-01 + DI-07 | DI-07 |

## Mandatory Order

1. **DI-00** — ADRs, baseline, process/security decisions (**this gate**).
2. **SDK-00** — standalone package workspace and CI.
3. **SDK-01** — close open protocol/security rows with DI-00 ADRs.
4. **DI-01 + SDK-02** — shared protocol contracts and fixtures.
5. **DI-02** — typed main-to-renderer broker.
6. **DI-03/04 + SDK-03/04** — transport, pairing, and capabilities.
7. **DI-05 + SDK-05** — read-only beta (`window:show` only).
8. **DI-06 + SDK-06** — call controls.
9. **DI-07 + SDK-07** — operator/logout.
10. **DI-08 + SDK-08** — privileged saved-profile activation.
11. **DI-09 + SDK-09** — settings and developer experience.
12. **DI-10 + SDK-10** — compatibility, security, packaged E2E, and release.

Independent `/sdk-review` is required after every work unit.

## DI Work Unit Gates

| Unit | Gate (reviewer must verify) | Prerequisites |
| --- | --- | --- |
| DI-00 | ADRs Accepted; baseline recorded; no production code; open rows owned | none |
| DI-01 | Protocol ports/mocks/fixtures; Domain free of protocol; F-011 still planned/in progress | DI-00 + SDK-01 |
| DI-02 | Typed broker; validation; reload/quit behavior; one composition | DI-01 |
| DI-03 | Loopback WS; limits; no product data unauthenticated | DI-02 |
| DI-04 | Origin/pairing/capabilities/replay/revoke; security review no Blocker | DI-03 + SDK-04 ready |
| DI-05 | Redacted snapshot/events; `window:show`; SIP-only/OCP-off tests | DI-04 + SDK-05 |
| DI-06 | Call commands via Call Engine; race/idempotency suite | DI-05 + SDK-06 |
| DI-07 | Operator/logout via existing orchestration; `callType: "sdk"` | DI-06 + SDK-07 |
| DI-08 | Opaque profile activation; no secrets on wire; AF-003/005/006 green | DI-07 + SDK-08 |
| DI-09 | Settings UX + i18n; hide disabled until tray ADR | DI-04 stable |
| DI-10 | Full matrix + packaged E2E; F-011 → implemented only with real evidence | DI-01…09 + SDK-00…09 |

## Regression Gate (unchanged; execute subsets per WU, full at DI-10)

- [ ] SIP-only sign-in/register/recovery/logout.
- [ ] Incoming/outgoing/answer/reject/hangup/hold/resume/mute/DTMF.
- [ ] Multi-call behavior.
- [ ] OCP auth/status/recovery/logout reasons/SIP cascade.
- [ ] Settings, media/video, headset, history, notifications, restart, and shutdown.
- [ ] SDK server disabled or failed does not block core softphone.
- [ ] SDK disconnect/revoke never terminates calls or account sessions.

Manual checklist: `axatalk-sdk-integration/SMOKE-CHECKLIST.md`.  
Automated matrix: `axatalk-sdk-integration/TEST-MATRIX.md`.

## Documentation Gate

- [x] F-011 planning references point at ADRs + packages (status remains planned).
- [x] LF-051/065/080/081 remain planned with execution-package pointers (no false done).
- [x] STATUS notes DI-00 architecture gate without claiming implementation.
- [x] Protocol/security open decisions synchronized with SDK-01 ownership.
- [x] Work-history and DI-00 evidence exist.
- [ ] No premature `implemented` status — enforced until DI-10.

## DI-00 Evidence Summary

- Automated: `npm run release:preflight` PASS — **2297 passed / 1 skipped** (2026-07-20, code preflight `5114c02`).
- `npm run i18n:check` PASS.
- `npm run ui:catalog:check` FAIL (pre-existing catalog drift; unrelated to DI-00; recorded in evidence).
- Manual regression checklist frozen in evidence (not executed this session — baseline document only).
- Production `src/` untouched; no new runtime dependencies.
- `/sdk-review` High/Low remediated: docs SHA split, F-011 `callType: 'sdk'`, SECURITY.md `window.hide` vs ADR-0013.

## Completion (P12 close — future)

P12 closes only when:

- DI-00…DI-10 and SDK-00…SDK-10 are independently reviewed;
- the complete automated and manual matrices pass;
- packaged Electron interoperates with the release-candidate SDK;
- compatibility and rollback are verified;
- F-011 is moved to `implemented` with real evidence;
- no Blocker remains.

## Next Agent Prompt

1. Run `/sdk-project` for **SDK-01** (protocol/security ADRs; close PROTOCOL O-* with desktop DI-00 ADR-0009…0013 baselines). Do **not** implement product APIs.
2. Do **not** start DI-01 until DI-00 and SDK-01 are done.
3. Do not install desktop production dependencies or write product `src/` until the owning DI unit.
