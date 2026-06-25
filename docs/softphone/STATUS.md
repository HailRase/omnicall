# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-06-25  
**Tests:** 704 passed, 1 skipped (`npm run test`) — F-014 gate closure  
**Lint / typecheck:** green (last verified 2026-06-25)

## Active phase

**P11 — Settings, Personalization, Shell UX**

| WU | Status | Handoff |
| --- | --- | --- |
| WU0 Shell layout | done | `handoffs/P11-WU0-Shell-Layout-Handoff.md` |
| WU1 Settings overlay | done | `handoffs/P11-WU1-Settings-Overlay-Handoff.md` |
| WU2 Call line UX | done | `handoffs/P11-WU2-Call-Line-UX-Handoff.md` |
| WU3 Header collapsed | done | `handoffs/P11-WU3-Header-Collapsed-Handoff.md` |
| WU4 Settings schema | done | `handoffs/P11-WU4-Settings-Schema-Handoff.md` |
| WU5 UI-4 CSS Modules | done | `handoffs/P11-WU5-UI-4-Final-Gate-Handoff.md` |

## Next work (priority)

See also: `TASK-QUEUE.md` for agent claim/done workflow.

1. **F-008 DTMF real** — T-003, `JsSipTelephonyAdapter.sendDtmf` — `/adapter`
2. **P10** headset foundation — T-004 — `/logic`
3. P11 polish: settings UX completeness, UI-6 Radix modals — `/ui`
4. Merge `feature/real-adapters` branch

**Recently closed (TASK-QUEUE):** T-001 icon tooltips (`handoffs/P11-Icon-Tooltips-Agent-Prompt.md`), T-002 AppIcon wiring (`Icon-Registry.md`), **F-014 SIP registration retry** (`handoffs/P08-SIP-Registration-Retry-Handoff.md`).

## RAT (Real Adapter Track)

| Item | Status |
| --- | --- |
| Branch | `feature/real-adapters` |
| Steps 00–08 | **closed** (R7 multi-call PASS) |
| OCP step 06 / R5 | **deferred** (ADR-0002) |
| Transfer step 07 / R6 | **backlog** |
| Baseline snapshot | `real-integration/00-SNAPSHOT.md` (historical 488) |
| Live progress | `real-integration/PROGRESS.md` |

## Backlog (do not scope-creep)

- OCP plugin — `OCP-PLUGIN-BACKLOG.md` (resume only when user cites it)
- Real transfer — `real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md`

## Archived handoffs

Completed phases P02–P08: `handoffs/archive/P0N/`
