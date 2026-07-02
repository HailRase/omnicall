# T-008 Phase 5 — UI removal

**Дата:** 2026-07-02 14:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/recovery/` (удалено)
- `src/renderer/shells/RecoveryFeatureShell.tsx` (удалено)
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/hooks/useSoftphoneShellChrome.ts`
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` §12
- `docs/softphone/Icon-Registry.md`

## Что
- Удалены `ConnectionOverlay`, `RecoveryFeatureShell`, хуки `useConnectionRecoveryShell` / `useConnectionRecoveryActions`
- Убрана кнопка `control-reregister-sip` из header
- `useSoftphoneShellChrome` оставляет только session logout; overlay не монтируется
- Обновлены Storybook (`ShellHeader.stories`), тесты header, icon catalog/registry
- `PhoneStatusBadge`: убраны online/offline из опций (только DND)
- §12 Progress: Phase 5 → done

## Зачем
Закрыть Phase 5 плана T-008: убрать fullscreen recovery overlay и header reregister до Phase 6 (новый header + «Состояние системы»).

## Результат
- `npm run test` — 1001 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Следующий шаг: Phase 6 `/ui` (header SIP status + SettingsSystemStatePanel)
