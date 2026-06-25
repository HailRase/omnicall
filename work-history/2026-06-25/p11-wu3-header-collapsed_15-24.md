# P11 WU3 — Header Avatar, Collapsed Shell

**Дата:** 2026-06-25 15:24
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P11-Header-Collapsed-UX-Design.md`
- `src/application/projections/deriveHeaderChromeShell.ts`
- `src/renderer/components/header/` (`UserAvatar`, `RegistrationStatusDot`)
- `src/renderer/shells/SoftphoneShellHeader.tsx`, `SoftphoneReadyShell.tsx`
- `src/renderer/widgets/SoftphoneLayout/`, `src/renderer/styles.css`
- `docs/softphone/handoffs/P11-WU3-Header-Collapsed-Handoff.md`

## Что
- UX-док и `deriveHeaderChromeShell` для dot variant, labels, avatar initials
- `UserAvatar` + `RegistrationStatusDot` на header; collapse toggle в `SoftphoneShellHeader`
- `useShellCollapse` + `SoftphoneLayout--collapsed`; ControlsZone скрыт, ContextZone compact `CallLineRow`
- Storybook (Expanded/Collapsed header) + ui:catalog (41 компонент)
- Legacy-Feature-Coverage: WU2 (LF-022, LF-057) + WU3 (LF-011, LF-076, LF-086)
- Feature Registry F-016 обновлён

## Зачем
Legacy-inspired compact header (~56px strip) с registration dot и collapse без потери call context (P11 WU3 gate).

## Результат
- `npm run test` — 676 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — OK
- STOP после WU3: settings schema / full user menu не начинались
