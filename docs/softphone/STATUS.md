# Project Status (live)

> **Authoritative snapshot for agents.** Update after each closed WU or RAT step. Reviewer skills read this during Discovery.

**Updated:** 2026-06-29  
**Tests:** 792 passed, 1 skipped (`npm run test`) — last verified 2026-06-29  
**Lint / typecheck:** green (last verified 2026-06-29)

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
| Post-WU5 shell polish | done | `handoffs/P11-Post-WU5-Shell-Polish-Handoff.md` |
| Call UI design parity (T-007) | done | `handoffs/P11-Call-UI-Design-Parity-Handoff.md` |

**P11 phase gate:** WU0–WU5 + post-WU5 polish + Call UI parity **done**. Remaining for phase close: UI-6 Radix modals, draggable widget (LF-056), toast placement (LF-060), codecs placeholder (LF-084), **LF-009 recovery UI** (new design — deferred). **LF-082 theme** done 2026-06-26.

## Next work (priority)

See also: `TASK-QUEUE.md` for agent claim/done workflow.

1. **P10** headset foundation — T-004 — `/logic`
2. P11 polish: UI-6 Radix modals — `/ui`
3. **LF-009** SIP recovery UI (redesign; projection `showAvatarRecoveryRing` ready) — `/ui`
4. Merge `feature/real-adapters` branch

**Recently closed (TASK-QUEUE):** T-007 Call UI design parity (`handoffs/P11-Call-UI-Design-Parity-Handoff.md`), post-WU5 shell polish (`handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`), T-005 fullscreen settings panel, T-001 icon tooltips, T-002 AppIcon wiring, **F-014 SIP registration retry** (`handoffs/P08-SIP-Registration-Retry-Handoff.md`).

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
