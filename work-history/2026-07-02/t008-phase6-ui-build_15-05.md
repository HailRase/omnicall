# T-008 Phase 6 — UI build

**Дата:** 2026-07-02 15:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveHeaderChromeShell.ts` (+ test)
- `src/renderer/components/header/UserHeaderIdentity.tsx` (+ module.css, test)
- `src/renderer/shells/SoftphoneShellHeader.tsx` (+ test)
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx` (+ module.css, test)
- `src/renderer/hooks/useSipSystemStateActions.ts`, `useSipRecoveryCountdownTick.ts`
- `src/renderer/hooks/useHeaderChromeShell.ts`, `useSettingsActions.ts`
- `src/renderer/components/settings/settingsSections.ts`, `SettingsPanel.tsx`, `SettingsGeneralPanel.tsx`
- `src/application/facades/AccountBootstrapFacade.ts` (journal + manual action accessors)
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` §12

## Что
- Header: `deriveHeaderChromeShell` → `deriveSipStatusShell`; dot + русская метка + суффикс таймера в `UserHeaderIdentity`
- Панель «Состояние системы»: статус осей, политики v2, ручные действия, журнал
- Перенос SIP recovery из «Общее» в «Состояние системы»; nav `settings-nav-system-state`
- Хуки `useSipSystemStateShell` / `useSipSystemStateActions`; тикер `useSipRecoveryCountdownTick`
- Storybook: light/dark для header и system-state; component tests с русскими строками
- §12 Progress: Phase 6 → done

## Зачем
Закрыть Phase 6 плана T-008: пользовательские поверхности SIP session health в header и настройках.

## Результат
- `npm run test` — 1006 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Следующая фаза: Phase 7 — Gate (`/preflight` → `/review`)
