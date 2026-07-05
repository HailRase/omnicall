# Task Queue

> Optional queue for agents when user does not specify a task. `scope-intake` reads this after `STATUS.md`.

**Updated:** 2026-07-06

| ID | Priority | Task | F-XXX | Command | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T-011 | 0 | Local account profiles + disk persistence | F-023 | `/logic` + `/adapter` | claimed | `P11-Local-Account-Profiles-Design.md` — steps 2–10 |
| T-008 | 0 | SIP transport/register state refactor (8 phases) | F-001,F-014,F-016 | `/logic` + `/ui` | done | `TRANSPORT-REGISTER-STATE-REFACTORING.md` — closed 2026-07-02; review follow-up 2026-07-04 |
| T-001 | 1 | Icon tooltips (1s delay) | F-016 | `/ui` | done | `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` |
| T-002 | 2 | Wire AppIcon in header/call controls | F-016 | `/ui` | done | `Icon-Registry.md` |
| T-003 | 3 | F-008 DTMF real adapter | F-008 | `/adapter` | pending | `JsSipTelephonyAdapter.sendDtmf` |
| T-005 | 5 | Fullscreen settings panel with sidebar sections | F-016, F-017 | `/ui` | done | P11 settings UX polish |
| T-007 | 7 | Call UI design parity (reference skeleton) | F-003,F-004,F-016 | `/ui` | done | `handoffs/P11-Call-UI-Design-Parity-Handoff.md` tasks 1–8 |
| T-009 | 8 | Codec preferences UI panel (LF-084) | F-022 | `/ui` | done | SettingsCodecsPanel + dnd-kit + i18n — closed 2026-07-05 |
| T-010 | 9 | JsSIP codec apply on call/answer | F-022 | `/adapter` | done | WU-4 dual-layer apply — closed 2026-07-05; manual SBC smoke optional/deferred |

## Status values

`pending` | `claimed` | `done` | `blocked` | `deferred`

Agents: set `claimed` at start, `done` when work-history written.
