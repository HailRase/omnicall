# P11 Icon Tooltips — Deferred Agent Prompt

**Status:** DONE — `IconTooltip` + `IconControlButton` (2026-06-25).

## Mission

Replace visible text labels on **icon-only** controls with semantic `AppIcon` + **1 second delay** hover tooltip. Preserve `aria-label` on controls for keyboard/screen reader users.

## Prerequisites

- `docs/softphone/Icon-Registry.md` entries exist
- `AppIcon` + `iconCatalog.ts` in place
- Icon-only buttons wired per registry (shell header, call controls, overlays)

## Scope

| Area | Controls |
| --- | --- |
| Shell header | settings, diagnostics, collapse/expand, end session, re-register |
| Call controls | hold, mute, transfer, hangup, answer, reject |
| Overlays | close sheet, modal dismiss |

## Out of scope

- Redesigning control layout
- Removing `aria-label`
- OCP / Domain changes

## Implementation notes

1. Create `IconTooltip` primitive in `src/renderer/components/icons/` (presentation only).
2. Delay: **1000ms** before show; hide on pointer leave.
3. Tooltip text from `iconCatalog` `defaultLabel` or projection copy when disabled reason exists.
4. CSS Module + tokens; no raw colors.
5. Respect `prefers-reduced-motion` / reduced transparency if applicable.
6. Update registry `usage` + Feature Registry F-016 evidence.

## Deliverables

- `IconTooltip.tsx` + module
- Wired icon-only controls per registry
- Tests for delay behavior (fake timers)
- Handoff + work-history

## T-001 Gate

- [x] `IconTooltip.tsx` + `IconTooltip.module.css` (tokens; no raw colors)
- [x] `IconControlButton` + `iconTooltipDelay.ts` (1000ms delay; `prefers-reduced-motion: reduce` → instant)
- [x] `resolveIconTooltipLabel` in `iconCatalog.ts` (catalog label / disabled reason)
- [x] Wired icon-only controls: shell header, call controls, overlays, dialpad, operator, recovery, transfer, toasts
- [x] `aria-label` preserved on all icon-only buttons
- [x] `prefers-reduced-transparency: reduce` → solid tooltip background
- [x] Tests: `IconTooltip.test.tsx` (fake timers — show, hide-before-delay, reduced-motion)
- [x] Feature Registry F-016 icon-tooltips evidence
- [x] TASK-QUEUE T-001 → `done`
- [x] `work-history/2026-06-25/icon-tooltips-t001_21-07.md`
- [x] 697 tests pass

## Verification (last run)

```bash
npm run test && npm run lint && npm run typecheck
# 697 passed, 1 skipped — 2026-06-25
```

## Related

- `guides/Icon-Agent-Guide.md`
- `.cursor/skills/icons/SKILL.md`
