# Task Queue

> Optional queue for agents when user does not specify a task. `scope-intake` reads this after `STATUS.md`.

**Updated:** 2026-06-26

| ID | Priority | Task | F-XXX | Command | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 1 | Icon tooltips (1s delay) | F-016 | `/ui` | done | `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` |
| T-002 | 2 | Wire AppIcon in header/call controls | F-016 | `/ui` | done | `Icon-Registry.md` |
| T-003 | 3 | F-008 DTMF real adapter | F-008 | `/adapter` | pending | `JsSipTelephonyAdapter.sendDtmf` |
| T-005 | 5 | Fullscreen settings panel with sidebar sections | F-016, F-017 | `/ui` | done | P11 settings UX polish |

## Status values

`pending` | `claimed` | `done` | `blocked` | `deferred`

Agents: set `claimed` at start, `done` when work-history written.
