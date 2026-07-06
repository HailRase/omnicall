# Real SIP Transfer — BACKLOG (Paused)

## Status

**BACKLOG** — not in active RAT scope until user resumes this file.

**Product default:** mock transfer (P05) remains fully green in CI; real transfer is **partial** on dev SBC.

**Formal semantics:** [ADR-0003](../adr/ADR-0003-sbc-refer-semantics.md) (on-net verified; off-net open).

**Resume trigger:** user says «resume transfer backlog» or references this file.

## For agents (read first)

- Transfer **mock path** (Use Cases, CallEngine, UI, projections) is **complete** — do not regress P05.
- Real adapter transfer code is **landed but not gate-closed** — do not block other RAT or roadmap work on R6 gaps.
- Do **not** ask «should we finish transfer?» — status is **backlog** until resume.
- Do **not** remove `JsSipTelephonyAdapter` transfer methods, `buildBlindReferTarget`, or ADR-0003 without ADR.

## What works (real adapter, dev SBC 2026-06-24)

| Area | Evidence | Notes |
| --- | --- | --- |
| Blind transfer → on-net extension | R6 smoke **A**, **D** PASS | `sip:{ext}@{account.domain}` Refer-To |
| Transfer failure UX | R6 PASS | NOTIFY sipfrag mapped; banner + retry; `multiLineCallProjection` recovery |
| REFER lifecycle | Unit tests + partial smoke | `executeJsSipRefer` — NOTIFY `accepted` or 202 + `ended`; `referInFlightCallIds` |
| Blind transfer adapter wiring | Code + tests | `buildBlindReferTarget`, `classifyReferTargetKind`, correlation logs |
| Attended transfer adapter | Unit tests green | REFER + Replaces in `JsSipTelephonyAdapter` — **manual R6 not run** |
| Mock / CI transfer | 599+ tests | `MockTelephonyGateway` blind + attended unchanged |

## What does not work / not verified (real adapter)

| Area | Evidence | Blocker |
| --- | --- | --- |
| Blind transfer → off-net / PSTN | R6 smoke **B**, **C** FAIL | Refer-To vs SBC dialplan; needs SIP trace (INVITE vs REFER) |
| Attended transfer end-to-end | R6 **pending manual** | Consultation + REFER+Replaces not smoke-tested on dev SBC |
| Multi-call hold-all on real SBC | Not started | Separate item in `step-07-transfer-and-multicall-deferred.md` |
| External `tel:` Refer-To | Smoke rejected | Reverted to `sip:n@domain` per ADR-0003 H1 revised |

## Smoke matrix (frozen at pause)

| ID | Scenario | Result |
| --- | --- | --- |
| A | Incoming client → blind transfer internal operator | **PASS** |
| B | Incoming operator → blind transfer external client | **FAIL** |
| C | Outgoing to operator → blind transfer external client | **FAIL** |
| D | Outgoing to client → blind transfer internal operator | **PASS** |
| — | Attended transfer with consultation | **not verified** |

## Code map (keep until resume)

| Layer | Path |
| --- | --- |
| Refer-To builder | `src/adapters/telephony/jssip/buildBlindReferTarget.ts` |
| REFER executor | `src/adapters/telephony/jssip/executeJsSipRefer.ts` |
| Gateway | `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts` — `blindTransfer`, `attendedTransfer` |
| Domain / Application | `BlindTransferUseCase`, `AttendedTransferUseCase`, `CallEngine` — unchanged |
| Projections | `transferProjection.ts`, `multiLineCallProjection.ts` |
| ADR | `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md` |
| RAT steps | `step-07-transfer-and-multicall-deferred.md`, `step-07b-external-blind-transfer-refer-target.md` |

## Resume checklist

1. Read this file + `PROGRESS.md` § step 07 / 07b + ADR-0003.
2. Phase 0: SIP trace — working INVITE to external vs failing REFER Refer-To (`step-07b` § Phase 0).
3. Fix `buildBlindReferTarget` per trace; re-run smoke matrix A–D.
4. Manual smoke attended transfer (R6).
5. Update Feature Registry F-006 / F-007 real-track notes; close R6 in `SMOKE-CHECKLIST.md`.
6. Mark step 07 `done` in `PROGRESS.md` only when gate criteria met or ADR documents SBC limitation.

## Active product track (while transfer is backlog)

- RAT R1–R4: **closed** (registration, media, calls, hold/mute on real SBC)
- Main roadmap: P08 SIP recovery channel, F-008 DTMF real, P10 headset, P11 settings/shell polish (RAT SIP core on `main`)
- OCP: still **deferred** (`OCP-PLUGIN-BACKLOG.md`)
