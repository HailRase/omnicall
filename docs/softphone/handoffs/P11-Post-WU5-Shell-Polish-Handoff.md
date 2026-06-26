# P11 Post-WU5 — Shell Polish Handoff

**Phase:** P11 (post-WU5 polish, not a numbered WU)  
**Baseline at start:** 694 passed, 1 skipped (after WU5 UI-4 gate)  
**After polish:** **743 passed**, 1 skipped (2026-06-26)  
**Features:** **F-016**, **F-014** (LF-009 UI path)

## Scope

1. **Dialpad home screen** — controls-first layout, session tabs, compact quick bar (F-016 / F-003 UI).
2. **Avatar recovery ring** — SIP re-registration indicator on header avatar; suppress fullscreen overlay (F-014 / LF-009).

## Delivered

| # | Area | Path |
| --- | --- | --- |
| 1 | Session tabs | `CallSessionTab.tsx`, `CallSessionTabs.tsx`, `CallSessionTab.test.tsx` |
| 2 | Compact quick bar | `ActiveCallQuickBar.tsx`, `ActiveCallQuickBar.test.tsx` |
| 3 | Dialpad split input | `Dialpad.tsx`, `Dialpad.module.css`, `Dialpad.test.tsx` |
| 4 | Controls stack | `CallControlsShell.tsx`, `SoftphoneLayout.tsx` |
| 5 | Context collapsed rows | `CallContextShell.tsx` (full `CallLineRow` only in collapsed mode) |
| 6 | Recovery projection | `deriveConnectionRecoveryShell.ts` (`showAvatarRecoveryRing`) |
| 7 | Avatar ring UI | `AvatarRecoveryRing.tsx`, `SoftphoneShellHeader.tsx` |
| 8 | Registration dot | `RegistrationStatusDot.module.css` (red `not_registered`) |
| 9 | Tests | `deriveConnectionRecoveryShell.test.ts`, `AvatarRecoveryRing.test.tsx`, `SoftphoneShellHeader.test.tsx` |
| 10 | Catalog | `UI-Component-Catalog.md` — `CallSessionTab`, `CallSessionTabs`, `AvatarRecoveryRing` |

## Gate Post-WU5 Polish

- [x] Dialpad home: controls zone first; tabs above split input+call
- [x] Held tab click resumes; `ActiveCallQuickBar` for active line controls
- [x] Fullscreen overlay hidden during SIP registration recovery (`showAvatarRecoveryRing`)
- [x] Avatar ring: countdown + pulse; Russian `aria-label`
- [x] Projection-driven shell flags; no SIP/Electron in components
- [x] Feature Registry F-016 + F-014 evidence updated
- [x] Legacy LF-009 evidence updated
- [x] **743** tests pass

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run ui:catalog
```

Expected: **743 passed**, 1 skipped.

## Work-history

- `work-history/2026-06-26/avatar-recovery-ring_13-41.md`
- `work-history/2026-06-26/dialpad-home-call-tabs_13-48.md`

## Out of scope (P11 phase gate remaining)

- UI-6 Radix + motion on incoming/campaign modals
- Theme LF-082, toast placement LF-060
- Draggable widget LF-056
- F-008 DTMF real adapter (T-003)
