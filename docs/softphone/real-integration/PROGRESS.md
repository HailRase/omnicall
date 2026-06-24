# RAT Progress

**Branch:** feature/real-adapters
**Base snapshot:** `00-SNAPSHOT.md` (2026-06-24, 488 tests)

| Step | Status | Date | Agent notes | Tests | Smoke |
| --- | --- | --- | --- | --- | --- |
| 00 Branch & guardrails | done | 2026-06-24 | Registry RAT notes F-001/002/003/009; guardrails closed; no src/ changes; commit — | 488 | n/a |
| 01 Adapter mode bootstrap | done | 2026-06-24 | adapterMode resolver; createSoftphoneComposition dispatcher; mock extracted; real stub; renderer wired | 496 (+8) | n/a |
| 02 JsSIP registration | done | 2026-06-24 | JsSipTelephonyAdapter; createRealAccountBootstrap wired; readSipEnvDefaults; AccountPanel prefill; transport disconnect handler | 502 (+6) | manual pending — see notes |
| 03 Browser media | pending | | | | |
| 04 Call lifecycle in/out | pending | | | | |
| 05 Hold / mute real | pending | | | | |
| 06 OCP WebSocket | pending | | | | |
| 07 Transfer (deferred) | pending | | | | |

## Current blocker

(none)

## Step 02 smoke notes (R1)

Automated: `npm run test` 502 passed (+6 adapter tests), lint/typecheck green; `SIP_SANDBOX=1` integration skipped by default.

Manual (requires `.env.local` + dev SBC): `npm run dev` → `http://localhost:5173/?adapters=real` — verify R1 checklist in `SMOKE-CHECKLIST.md` (register, Online badge, wrong password, disconnect overlay).

## Dev credentials

Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root.
