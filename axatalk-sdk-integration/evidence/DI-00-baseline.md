# DI-00 Baseline Evidence

**Date:** 2026-07-20 11:45 (local)  
**Branch:** `feature/axatalk-sdk`  
**Code preflight commit:** `5114c02` (automated suite; no `src/` changes for DI-00)  
**DI-00 docs commit:** `_PENDING_`  
**Desktop version:** `0.11.2`  
**OS:** Darwin 24.5.0 arm64  
**Node:** v22.20.0  
**npm:** 10.9.3  
**Work unit:** DI-00 — ADRs, Baseline, and P12 Handoff  
**Production code changed:** none  
**Runtime dependencies added:** none

## Automated Preflight

| Command | Result | Notes |
| --- | --- | --- |
| `npm run release:preflight` | **PASS** | `test` + `lint` + `typecheck` + `registry:check` |
| Vitest | **2297 passed / 1 skipped** (2298 total) | Test files: 437 passed / 1 skipped (438) |
| `npm run i18n:check` | **PASS** | 457 files scanned |
| `npm run ui:catalog:check` | **FAIL** | Pre-existing drift in `docs/softphone/UI-Component-Catalog.md` vs generator (`OcpSignInProgress` / overwrite-modal testids). **Not introduced by DI-00.** Do not treat as P12 Blocker; fix in a separate docs/catalog hygiene task if desired. |
| `npm run registry:check` | **PASS** (via preflight) | 55 found, 0 missing |

Prior STATUS snapshot (2026-07-19) listed 2276 passed / 1 skipped; DI-00 refresh records **2297 / 1** on code preflight commit `5114c02`.

## Manual Regression Checklist (frozen for DI-10 / release)

Source of truth: `axatalk-sdk-integration/SMOKE-CHECKLIST.md`.

DI-00 records the checklist existence and scope; **manual execution is deferred** until
relevant DI units and DI-10. Agents must not mark smoke items PASS without a dated run.

Baseline regression themes that any P12 change must not break:

1. SIP-only sign-in / register / recovery / logout (OCP disabled).
2. Incoming / outgoing / answer / reject / hangup / hold / resume / mute / DTMF.
3. Multi-call policy.
4. OCP authenticate / status / logout-reason / SIP cascade (when staging available).
5. Settings, media/video, headset, history, notifications.
6. App close / restart cleanup.
7. SDK disabled or gateway failure must not block core softphone (enforced from DI-03+).

## Architecture Artifacts Produced

| Artifact | Path |
| --- | --- |
| Process ownership ADR | `docs/softphone/adr/ADR-0009-sdk-process-ownership-broker-lifecycle.md` |
| Transport/discovery ADR | `docs/softphone/adr/ADR-0010-sdk-local-transport-endpoint-discovery.md` |
| Pairing/security ADR | `docs/softphone/adr/ADR-0011-sdk-pairing-origin-capabilities.md` |
| Protocol/privacy ADR | `docs/softphone/adr/ADR-0012-sdk-protocol-versioning-privacy-ownership.md` |
| Window + sign-in ADR | `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md` |
| P12 handoff | `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md` |

## Explicit Non-Goals (DI-00)

- No `src/` production changes.
- No WebSocket server, broker, or protocol package implementation.
- No dependency installs for SDK/desktop gateway.
- No F-011 status change to `implemented` or `in progress` beyond planning refs.
- No DI-01+ work.

## Reviewer

`/sdk-review` PASS (2026-07-20). High/Low findings remediated: docs committed with accurate SHA split (code preflight vs DI-00 docs); F-011 `callType: 'sdk'`; SECURITY.md aligns `window.hide` with ADR-0013.
