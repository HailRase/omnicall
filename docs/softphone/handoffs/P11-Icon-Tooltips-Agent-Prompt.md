# P11 Icon Tooltips — Deferred Agent Prompt

**Status:** DEFERRED — start only after explicit user request or WU5 CSS migration gate.

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

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

## Related

- `docs/softphone/Icon-Agent-Guide.md`
- `.cursor/skills/icons/SKILL.md`
