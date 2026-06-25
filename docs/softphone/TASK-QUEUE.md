# Task Queue

> Optional queue for agents when user does not specify a task. `scope-intake` reads this after `STATUS.md`.

**Updated:** 2026-06-25

| ID | Priority | Task | F-XXX | Command | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 1 | Icon tooltips (1s delay) | F-016 | `/ui` | done | `handoffs/P11-Icon-Tooltips-Agent-Prompt.md` |
| T-002 | 2 | Wire AppIcon in header/call controls | F-016 | `/ui` | done | `Icon-Registry.md` |
| T-003 | 3 | F-008 DTMF real adapter | F-008 | `/adapter` | pending | `JsSipTelephonyAdapter.sendDtmf` |
| T-004 | 4 | P10 headset foundation | F-011+ | `/logic` | pending | Roadmap P10 |

## Status values

`pending` | `claimed` | `done` | `blocked` | `deferred`

Agents: set `claimed` at start, `done` when work-history written.
