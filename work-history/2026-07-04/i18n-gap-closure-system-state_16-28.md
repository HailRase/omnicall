# I18N Gap Closure — System State, Dialpad, Recovery

**Дата:** 2026-07-04 16:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/deriveSipSystemStateShell.ts`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/hooks/useSipSystemStateActions.ts`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/i18n/messages.ts`, `runtime.ts`, `index.ts`
- `src/renderer/helpers/mapConnectionRecoveryDisabledReason.ts`
- `src/renderer/App.tsx`, `OcpToastStack.tsx`, `ShellOverlaySheet.tsx`, `CallControlsShell.tsx`
- `scripts/check-i18n-hardcoded.mjs`
- `docs/softphone/I18N-Coverage.md`

## Что
- Projection `deriveSipSystemStateShell` переведён на semantic keys (`settings.systemState.*`)
- Settings System State panel, dialpad, bootstrap/shell/toast/audio — полная i18n-миграция
- Hook manual actions возвращает `actionSuccessKey` / `actionErrorKey` + platform detail
- Каталог `messages.ts`: +93 ru-ключа, полные en/fr/de overrides (357 ключей на локаль)
- Helper `mapConnectionRecoveryDisabledReason` + тесты
- `i18n:check` — full-repo scan (кириллица + English в renderer UI)
- `I18N-Coverage.md` актуализирован; ConnectionOverlay отмечен как удалённый (T-008)

## Зачем
Закрыть пробелы F-021 / ADR-0006: language switch на System State, Dialpad, recovery keys; parity ru/en/fr/de.

## Результат
- `npm run test`: 1044 passed, 1 skipped
- `npm run lint`: green
- `npm run typecheck`: green
- `npm run i18n:check`: green (161 files)
