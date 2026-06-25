# P11 WU2 — Call Line UX Handoff

**Phase:** P11 WU2  
**Baseline:** 651 passed, 1 skipped (commit `142e2ab`)  
**After WU2:** **663 passed**, 1 skipped  

## Deliverables

| # | Area | Status | Path |
|---|------|--------|------|
| 0 | Overlay click-through fix | done | `ConnectionOverlay.tsx`, `styles.css`, test |
| 1 | UX doc | done | `docs/softphone/P11-Call-Line-UX-Design.md` |
| 2 | `deriveCallLineStatusLabel` | done | `src/application/projections/deriveCallLineStatusLabel.ts` |
| 3 | View-model extend | done | `deriveCallLinesShell.ts`, `multiLineCallProjection.ts` |
| 4 | `CallLineRow` | done | `src/renderer/components/call/CallLineRow.tsx` |
| 5 | `useCallLineRowShell` | done | `src/renderer/hooks/useCallLineRowShell.ts` |
| 6 | Actions wiring | done | `useCallLinesActions.ts`, `handleTransferLine` in `useCallFeatureShell` |
| 7 | Zone refactor | done | `CallContextShell.tsx`, `CallControlsShell.tsx` |
| 8 | Styles | done | `styles.css` (call-line-row, overlay scrim) |
| 9 | Tests | done | derive + `CallLineRow` + overlay scrim tests |
| 10 | Storybook | done | `CallLineRow.stories.tsx` |
| 11 | Catalog | done | `npm run ui:catalog` → 40 components |
| 12 | Docs | done | blueprint + registry + this handoff |

## Gate WU2

- [x] Overlay click-through fixed for blocking recovery (LF-057 presentation)
- [x] `P11-Call-Line-UX-Design.md` created
- [x] `CallLineRow` visible for single established call
- [x] Human status labels via `deriveCallLineStatusLabel`
- [x] Hold/mute/transfer on row; contextual primary hangup/resume
- [x] No facade in components; disabled reasons from projection
- [x] Storybook + ui:catalog updated
- [x] Feature Registry F-016 + F-003/F-004 call UI evidence updated
- [x] All tests green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

## Next WU (WU3 — after reviewer «Проверяй»)

- Header avatar + compact registration status dot
- Collapsed shell mode (~56px strip)
- See P11 roadmap item 9 / legacy `Header.tsx` reference

**STOP** — do not start WU3 until gate review passes.
