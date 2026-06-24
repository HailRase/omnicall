# RAT Progress

**Branch:** feature/real-adapters
**Base snapshot:** `00-SNAPSHOT.md` (2026-06-24, 488 tests)

| Step | Status | Date | Agent notes | Tests | Smoke |
| --- | --- | --- | --- | --- | --- |
| 00 Branch & guardrails | done | 2026-06-24 | Registry RAT notes F-001/002/003/009; guardrails closed; no src/ changes; commit — | 488 | n/a |
| 01 Adapter mode bootstrap | done | 2026-06-24 | adapterMode resolver; createSoftphoneComposition dispatcher; mock extracted; real stub; renderer wired | 496 (+8) | n/a |
| 02 JsSIP registration | pending | | | | |
| 03 Browser media | pending | | | | |
| 04 Call lifecycle in/out | pending | | | | |
| 05 Hold / mute real | pending | | | | |
| 06 OCP WebSocket | pending | | | | |
| 07 Transfer (deferred) | pending | | | | |

## Current blocker

(none)

## Dev credentials

Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root.
