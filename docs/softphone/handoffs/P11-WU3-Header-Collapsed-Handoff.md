# P11 WU3 — Header, Avatar, Collapsed Shell Handoff

**Phase:** P11 WU3  
**Baseline:** 663 passed, 1 skipped (after WU2)  
**After WU3:** **676 passed**, 1 skipped (+13)

## Deliverables

| # | Area | Status | Path |
|---|------|--------|------|
| 0 | WU2 follow-up in Legacy Coverage | done | `Legacy-Feature-Coverage.md` (LF-022, LF-057 scrim) |
| 1 | UX doc | done | `docs/softphone/P11-Header-Collapsed-UX-Design.md` |
| 2 | Header derive | done | `deriveHeaderChromeShell.ts`, `useHeaderChromeShell.ts` |
| 3 | Components | done | `UserAvatar.tsx`, `RegistrationStatusDot.tsx` |
| 4 | Header refactor | done | `SoftphoneShellHeader.tsx` |
| 5 | Layout collapse | done | `SoftphoneLayout.tsx`, `useShellCollapse.ts`, `styles.css` |
| 6 | Call context compact | done | `CallLineRow` compact, `CallContextShell` collapsed |
| 7 | Tests | done | derive + component + shell tests |
| 8 | Storybook | done | `ShellHeader.stories.tsx`, `SoftphoneLayout` Collapsed story |
| 9 | Docs | done | Feature Registry F-016, this handoff |

## Gate WU3

- [x] `P11-Header-Collapsed-UX-Design.md` created
- [x] Collapsed mode toggles without losing call context
- [x] Compact registration status (LF-011)
- [x] Avatar placeholder (LF-086 partial — menu deferred)
- [x] Legacy-Feature-Coverage updated (WU2 + WU3)
- [x] Storybook + ui:catalog
- [x] All tests green (verify locally)

## Verification

```bash
npm run test && npm run lint && npm run typecheck
npm run ui:catalog
```

## STOP

Do not start settings schema / full user menu (P11 items 2–4). Next WU after reviewer «Проверяй».
