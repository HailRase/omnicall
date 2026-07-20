# P12 External Host API and Axatalk SDK — Master Handoff

## Status

| Field | Value |
| --- | --- |
| Feature | F-011 Host Integration Contract |
| Legacy | LF-051, LF-065, LF-080, LF-081 |
| Phase | P12 External Host API Compatibility |
| Feature status | **in progress** (DI-01…DI-06 `done`; next DI-07) |
| Branch | `feature/axatalk-sdk` |
| Desktop version | `0.11.2` |
| DI-00 | `done` — `/sdk-review` PASS 2026-07-20 |
| SDK-00…SDK-03 | `done` — `/sdk-review` PASS (SDK package) |
| DI-01 | **`done`** — `/sdk-review` PASS 2026-07-20; evidence `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md` |
| DI-02 | **`done`** — `/sdk-review` PASS 2026-07-20; evidence `axatalk-sdk-integration/evidence/DI-02-typed-main-renderer-broker.md` |
| DI-03 | **`done`** — `/sdk-review` PASS 2026-07-20; evidence `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md` |
| DI-04 | **`done`** — `/sdk-review` PASS 2026-07-20; evidence `axatalk-sdk-integration/evidence/DI-04-pairing-origin-capabilities.md` |
| DI-05 | **`done`** — `/sdk-review` PASS 2026-07-20 re-gate; evidence `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md` |
| DI-06 | **`done`** — call command router + revision-contract fix; evidence `axatalk-sdk-integration/evidence/DI-06-call-command-router.md` |
| Next | **DI-07** operator/logout via `/sdk-integration` (do not mark F-011 `implemented`) |

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
| [ADR-0010](../adr/ADR-0010-sdk-local-transport-endpoint-discovery.md) | Loopback transport, discovery, browsers | Accepted; precision → ADR-0015 |
| [ADR-0011](../adr/ADR-0011-sdk-pairing-origin-capabilities.md) | Origin, pairing, capabilities, replay, revoke | Accepted; PoP/profiles → ADR-0016 |
| [ADR-0012](../adr/ADR-0012-sdk-protocol-versioning-privacy-ownership.md) | Versioning, privacy, call ownership | Accepted; precision → ADR-0014/0017 |
| [ADR-0013](../adr/ADR-0013-sdk-window-policy-and-signin.md) | Window show/hide + AF-003 sign-in relationship | Accepted |
| [ADR-0014](../adr/ADR-0014-sdk-runtime-schema-source-of-truth.md) | Zod schema SoT + fixture format | Accepted (SDK-01) |
| [ADR-0015](../adr/ADR-0015-sdk-discovery-and-browser-lna-policy.md) | Discovery URL + browser LNA matrix | Accepted (SDK-01) |
| [ADR-0016](../adr/ADR-0016-sdk-pop-pairing-capability-profiles.md) | PoP, pairing ceremony, capability profiles | Accepted (SDK-01) |
| [ADR-0017](../adr/ADR-0017-sdk-privacy-ownership-ocp-map-deprecation.md) | PII, ownership, campaign, OCP map, deprecation | Accepted (SDK-01) |

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

- [x] Loopback-only endpoint and single-instance ownership (ADR-0010) — DI-03 `done`.
- [x] Exact Origin gate before data exchange (ADR-0011) — DI-04 `done`.
- [x] Per-client pairing, capabilities, expiry, and revocation (ADR-0011) — DI-04 `done`.
- [x] Replay/idempotency and aggregate command serialization (ADR-0011/0012) — DI-04 challenge/request dedup `done`; DI-06 call aggregate serialization + cached `requestId` replies `done`.
- [x] Resource limits, heartbeat, backpressure, and safe teardown (ADR-0010) — DI-03 `done`.
- [x] Per-client redacted events; no indiscriminate broadcast (ADR-0012) — DI-05 `done`.
- [x] No raw SIP/OCP credentials in protocol v1 (ADR-0013).
- [x] Independent security review has no Blocker — **DI-04** `/sdk-review` PASS; full packaged matrix remains **DI-10**.

### Protocol precision decisions (SDK-01)

Previously open O-* rows are **closed** in ADR-0014…0017 and
`axatalk-sdk/docs/PROTOCOL.md`. Desktop must implement them as written (no silent drift).

| ID | Topic | Resolution |
| --- | --- | --- |
| O-DISC-1/2 | Discovery URL/schema vs HTTP helper | ADR-0015 |
| O-BRW-1/2 | Browser HTTPS→loopback WS matrix + PNA UX keys | ADR-0015 → DI-09 |
| O-POP-1/2 | Proof-of-possession + pairing ceremony | ADR-0016 |
| O-CAP-1 | Default capability profiles | ADR-0016 |
| O-SCHEMA-1 | Runtime schema library / generation | ADR-0014 |
| O-PII-1 | Exact PII mask levels | ADR-0017 |
| O-OWN-1 | Call ownership / revision / idempotency | ADR-0017 |
| O-CAMP-1 | Campaign events in v1? | ADR-0017 — deferred |
| O-OCP-1 | Public operator names vs F-028 E-12 | ADR-0017 |

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
| DI-04 | Origin/pairing/capabilities/replay/revoke; security review no Blocker | DI-03; SDK-04 optional (desktop server-side) |
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

- [x] F-011 planning references point at ADRs + packages (status **`in progress`** after DI-01 contracts; not implemented).
- [x] LF-051/065/080/081 remain planned with execution-package pointers (no false done).
- [x] STATUS notes DI-00…DI-02 gates without claiming product gateway.
- [x] Protocol/security open decisions synchronized with SDK-01 ownership.
- [x] Work-history and DI-00 evidence exist.
- [x] DI-01 evidence exists; `/sdk-review` PASS (`evidence/DI-01-protocol-ports-mocks.md`).
- [x] DI-02 evidence exists; `/sdk-review` PASS (`evidence/DI-02-typed-main-renderer-broker.md`).
- [x] DI-03 evidence exists; `/sdk-review` PASS (`evidence/DI-03-loopback-websocket-transport.md`).
- [x] DI-04 evidence exists; `/sdk-review` PASS (`evidence/DI-04-pairing-origin-capabilities.md`).
- [x] DI-05 evidence exists; `/sdk-review` PASS re-gate (`evidence/DI-05-read-only-snapshot-events-window-show.md`).
- [x] DI-06 evidence exists; status **`done`** (`evidence/DI-06-call-command-router.md`) — revision contract remediated 2026-07-20.
- [x] No premature `implemented` status — enforced until DI-10.

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

1. Run **`/sdk-integration` DI-07 only** — operator status + logout. Do not mark F-011 `implemented`.
2. Keep SDK-07 client package non-blocking (protocol DTOs already in SDK-02; mirror DI-05/DI-06).
3. Keep Domain free of protocol / Zod / Electron / ws imports; gateway must not import Facades/Call Engine.
4. Do not mark F-011 `implemented` until DI-10.
