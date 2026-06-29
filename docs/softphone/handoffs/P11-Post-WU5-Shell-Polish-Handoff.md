# P11 Post-WU5 — Shell Polish Handoff

**Phase:** P11 (post-WU5 polish, not a numbered WU)  
**Baseline at start:** 694 passed, 1 skipped (after WU5 UI-4 gate)  
**After polish (2026-06-26):** 743 passed, 1 skipped  
**After Call UI parity + cleanup (2026-06-29):** **792 passed**, 1 skipped  
**Features:** **F-016**, **F-014** (LF-009 projection path)

## Scope (original → current)

1. **Dialpad / call home** — superseded by **Call UI design parity** (T-007): `CallSessionCard`/`CallSessionStack`, `CallControlsBar`, reference `Dialpad`.
2. **SIP recovery UX** — projection suppresses fullscreen overlay during registration recovery; interim header control `control-reregister-sip`. Avatar recovery ring **deferred** (LF-009 UI redesign — not header ring).

## Delivered (verified 2026-06-29)

| # | Area | Path |
| --- | --- | --- |
| 1 | Call UI skeleton | `CallContextShell.tsx`, `CallControlsShell.tsx`, `SoftphoneLayout` — see `P11-Call-UI-Design-Parity-Handoff.md` |
| 2 | Labeled controls | `CallControlsBar.tsx` (replaces removed `ActiveCallQuickBar`) |
| 3 | Session cards | `CallSessionCard.tsx`, `CallSessionStack.tsx`, `CallIdleEmptyState.tsx` |
| 4 | Reference dialpad | `Dialpad.tsx`, `Dialpad.module.css` |
| 5 | Recovery projection | `deriveConnectionRecoveryShell.ts` (`showAvatarRecoveryRing` → overlay suppression) |
| 6 | Header recovery control | `SoftphoneShellHeader.tsx` — `control-reregister-sip` when `showReregisterSipControl` |
| 7 | Registration dot | `RegistrationStatusDot.module.css` (red `not_registered`) |
| 8 | Tests | `deriveConnectionRecoveryShell.test.ts`, `SoftphoneShellHeader.test.tsx`, Call UI parity component tests |
| 9 | Removed orphans | ~~`ActiveCallQuickBar`~~, ~~`CallSessionTab`~~, ~~`CallSessionTabs`~~ (superseded by T-007) |

## Gate Post-WU5 Polish

- [x] Call zone layout: context top (sessions/idle/DTMF/transfer), controls bottom (`CallControlsBar` + dialpad) — T-007
- [x] Multi-call: `CallSessionStack`; single call: `CallSessionCard`; held line resume via card action
- [x] Fullscreen overlay hidden during SIP registration recovery (`showAvatarRecoveryRing` projection)
- [x] Interim recovery UX: `control-reregister-sip` in header + `RegistrationStatusDot`
- [ ] Avatar recovery ring on avatar — **deferred** (LF-009; new design; `AvatarRecoveryRing.tsx` kept as prototype only)
- [x] Projection-driven shell flags; no SIP/Electron in components
- [x] Feature Registry F-016 + F-014 evidence updated
- [x] Legacy LF-009 projection evidence; avatar UI deferred to future WU
- [x] **792** tests pass

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run ui:catalog
```

Expected: **792 passed**, 1 skipped.

## Work-history

- `work-history/2026-06-26/avatar-recovery-ring_13-41.md`
- `work-history/2026-06-26/dialpad-home-call-tabs_13-48.md`
- `work-history/2026-06-26/call-ui-design-parity_17-20.md`
- `work-history/2026-06-29/call-ui-polish-hold-dialpad_12-10.md`
- `work-history/2026-06-29/post-wu5-doc-sync-orphan-cleanup_14-12.md`

## Out of scope (P11 phase gate remaining)

- LF-009 recovery UI redesign (avatar/header)
- UI-6 Radix + motion on incoming/campaign modals
- Theme LF-082 (done), toast placement LF-060
- Draggable widget LF-056
- Codecs placeholder LF-084
