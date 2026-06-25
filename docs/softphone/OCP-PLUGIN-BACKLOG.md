# OCP Plugin — DEFERRED (Far Backlog)

## Status

**DEFERRED** — not in active product scope.

**Product default:** SIP-only softphone (`mode: "sip-only"`).

**Formal decision:** [ADR-0002](adr/ADR-0002-defer-ocp-plugin.md).

**Resume trigger:** user explicitly says «resume OCP backlog» or references this file.

## For agents (read first)

- OCP is an **optional integration plugin**, not core telephony.
- Do **not** implement, smoke-test, debug, or gate core work on OCP unless the user resumes this backlog.
- Do **not** ask «should we do OCP?» — the answer is here: **deferred**.
- Existing mock OCP code and dormant real WebSocket adapters are **intentional**; do not remove without ADR.
- Legacy parity for Operator `LF-XXX` rows below must be completed **when this backlog resumes**, not during SIP/transfer/headset work.

## Active product track (priority)

Core softphone without OCP:

- SIP registration, media, calls, hold/mute (RAT R1–R4 closed)
- SIP recovery (F-014 SIP channel)
- Headset, settings, host API (roadmap P10–P12)
- Real SIP transfer: **backlog** (`real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md`)

## Scope when backlog resumes (full legacy parity)

| Area | Feature IDs | Legacy IDs |
| --- | --- | --- |
| OCP auth & bootstrap UI | F-009 | LF-001–004, LF-085 |
| Operator status & post-call | F-010 | LF-018–019, LF-041–049, LF-062, LF-078 |
| OCP sync, queue, campaigns | F-015 | LF-037–040, LF-050, LF-059, LF-063–064 |
| OCP recovery channel (real WS) | F-014 (OCP slice) | LF-057–058 (OCP row on real stand) |
| RAT real integration | step 06 + R5 smoke | `SMOKE-CHECKLIST.md` § R5 |

## Architecture invariant (unchanged)

Core telephony must work with OCP fully removed or never enabled.

See `Architecture-Constitution.md` § Optional OCP Architecture.

SIP-only guards: `isOcpMode`, `isOcpStatusAvailable`, `isOcpSyncAvailable` — do not weaken.

## Code map (dormant until resume)

| Layer | Path |
| --- | --- |
| Ports | `src/ports/operator/OperatorPlatformGateway.ts`, `OcpSyncGateway.ts` |
| Mock (CI default) | `src/adapters/mock/MockOperatorPlatformGateway.ts`, `MockOcpSyncGateway.ts` |
| Real WS (dormant) | `src/adapters/operator/websocket/*` |
| Bootstrap | `createRealAccountBootstrap.ts` — real OCP only when `mode=ocp` + WS URL |
| Domain | `src/domain/operator/**` |

## Resume checklist

1. Read this file + `Legacy-Feature-Coverage.md` § Deferred by product decision.
2. Run manual smoke R5 (`SMOKE-CHECKLIST.md` § R5) on dev OCP stand.
3. Update Feature Registry real-track notes F-009, F-010, F-015.
4. Close RAT step 06 gate in `real-integration/PROGRESS.md` (smoke R5).
5. Continue Operator phases P06/P07 only if still gaps vs legacy acceptance.
